import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BookingEntity } from "../entity/booking.entity";
import { Between, Repository } from "typeorm";
import { forkJoin, from, map, Observable, of, switchMap, tap } from "rxjs";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../../utils/exceptions/UUIDBadFormat.exception";
import { UpdateBookingInput } from "../model/update-booking.input";
import { ParkingService } from "../../parking/service/parking.service";
import { UserService } from "../../user/service/user.service";
import { CreateBookingInput } from "../model/create-booking.input";
import { ExistingBookingDateException } from "../../utils/exceptions/existing-booking-date.exception";
import { Cron, CronExpression, SchedulerRegistry } from "@nestjs/schedule";
import { EmailService } from "../../utils/email/email.service";
import { SmsService } from "../../utils/sms/sms.service";
import { BookingNotificationsEnum } from "../enum/booking-notifications.enum";
import { EmailTypesEnum } from "../../utils/email/enum/email-types.enum";
import { BookingStatesEnum } from "../enum/booking-states.enum";
import { DateTime, Settings } from "luxon";
import { CronJob } from "cron";
import { BookingTypesEnum } from "../enum/booking-types.enum";
import { UpdateUserInput } from "../../user/model/dto/update-user.input";
import { CronService } from "../../utils/cron/cron.service";
import { CronEntity } from "../../utils/cron/entity/cron.entity";
import { UpdateParkingInput } from "../../parking/model/update-parking.input";
import { PageDto, PageOptionsDto, PaginationMeta } from "../../utils/interfaces/pagination.type";
import { ClientEntity } from "../../client/entity/client.entity";
import { UserTypesEnum } from "../../user/constants/constants";
import { BookingDailyFinance, BookingDailyIncomeFinance } from "../model/finance-booking.output";
import * as _ from "lodash";

@Injectable()
export class BookingService implements OnModuleInit {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    private readonly parkingService: ParkingService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly scheduler: SchedulerRegistry,
    private readonly cronService: CronService,
  ) {}
  @Cron(CronExpression.EVERY_DAY_AT_5AM, {
    name: 'checkMonthlyAndYearlyReservations',
  })
  private checkMonthlyAndYearlyReservations(): void {
    const shouldNotify = true
    this.findBookingsThatExpiresTodayAndUpdateTheirStatus(shouldNotify);
    this.findBookingsThatAreGoingToExpireIn3Days(shouldNotify);
  }

  onModuleInit(): any {
    Settings.defaultZone = 'America/Sao_Paulo';
    this.checkMonthlyAndYearlyReservations()
    this.loadCronsFromRepository()
  }
  getBookingCountForOrderNumber(): Observable<number> {
    return from(
      this.bookingRepository.query(`select count(id)+1 as order_number from booking`)
    ).pipe(map((b) => +b[0].order_number))
  }
  createBooking(createBookingInput: CreateBookingInput, parkingId: string, userId: string): Observable<BookingEntity> {
    const booking = this.bookingRepository.create(createBookingInput);
    const parking = this.parkingService.findParkingById(parkingId)
    const user = this.userService.findUserById(userId)
    return this.getBookingsForParkingIdByDateRange(parkingId, DateTime.fromISO(createBookingInput.dateStart).toJSDate(), DateTime.fromISO(createBookingInput.dateStart).plus({hour: 1, minutes: 5}).toJSDate())
      .pipe(switchMap((bookings) => {
          if(bookings && bookings.length > 0){
            throw new ExistingBookingDateException();
          }

        return forkJoin([parking,user]).pipe(
          switchMap(([parking,user]) => {
            booking.parking = parking;
            booking.user = user;
            booking.dateStart = DateTime.now().toJSDate();
            booking.dateEnd = DateTime.now().plus({minutes: 1}).toJSDate()
            return from(this.bookingRepository.save(booking)).pipe(tap((b) => {
              if(booking.bookingState === BookingStatesEnum.PAYMENT_REQUIRED)
                this.createBookingCronJobForPaying(booking);
            }))
          }));
      })
    )
  }
  updateBooking(updateBookingInput: UpdateBookingInput): Observable<BookingEntity> {
    const booking$ = this.findBookingById(updateBookingInput.id)
    return booking$.pipe(
      switchMap((previousBooking) => {
        return from(
          this.bookingRepository.preload({
            ...updateBookingInput,
          }),
        ).pipe(
          switchMap((booking) => {
            if (!booking) {
              throw new NotFoundException();
            }
            const parking = previousBooking.parking;
            if(booking.bookingState === BookingStatesEnum.FINALIZED) {
              if(booking.bookingType === BookingTypesEnum.NORMAL_BOOKING) {
                const isoExtendedDate = DateTime.fromISO(booking.dateExtended as any as string)
                const diff = isoExtendedDate.diffNow(['minutes'], {conversionAccuracy: "casual"})
                booking.finalPrice = diff.minutes * +parking.pricePerMinute
              }
              booking.dateEnd = DateTime.now().toJSDate();
              parking.reserved = false;
              if(this.scheduler.doesExist("cron",booking.id)) {
                const job = this.scheduler.getCronJob(booking.id)
                job.stop();
                this.cronService.findCronByBookingIdAndExecuteFalse(booking.id)
                  .pipe(
                    switchMap((c) => {
                      if(!c)
                        return of(null)
                      c.executed = true
                      return this.cronService.saveCron(c)
                    })).toPromise().then()
              }
            }

            if(previousBooking.bookingState === BookingStatesEnum.PAYMENT_REQUIRED && booking.bookingState === BookingStatesEnum.RESERVED) {

              if(booking.bookingType === BookingTypesEnum.MONTHLY_BOOKING){
                booking.dateEnd = DateTime.now().plus({days: 30}).toJSDate()
                booking.paid = true
              }else {
                booking.dateEnd = DateTime.now().plus({hour: 1, minutes: 5}).toJSDate()
                this.createBookingCronJobForOneHourStartPlus5Minutes(booking);
              }

              booking.dateStart = DateTime.now().toJSDate()
              parking.reserved = true;

              const updateParking: UpdateParkingInput = {
                id: parking.id,
                reserved: parking.reserved,
              }
              return from(this.parkingService.updateParking(updateParking)).pipe(switchMap(() => from(this.bookingRepository.save(booking))))
            }

            if(previousBooking.bookingState === BookingStatesEnum.RESERVED && booking.bookingState === BookingStatesEnum.FINALIZED && booking.bookingType === BookingTypesEnum.NORMAL_BOOKING) {
              if(booking.dateExtended){
                const extendedMinutes = DateTime.fromJSDate(booking.dateEnd).diff(DateTime.fromJSDate(booking.dateExtended), ['minutes']).minutes
                booking.finalPrice = Math.round(booking.initialPrice + (extendedMinutes * +parking.pricePerMinute))
              }else {
                const minutesStayed = DateTime.fromJSDate(booking.dateEnd).diff(DateTime.fromJSDate(booking.dateStart), ['minutes']).minutes
                booking.finalPrice = Math.round(minutesStayed * +parking.pricePerMinute)
                const updateUser: UpdateUserInput = {
                  id: previousBooking.user.id,
                  wallet: Math.round(previousBooking.user.wallet + (booking.initialPrice - booking.finalPrice))
                }
                this.userService.updateUser(updateUser).toPromise().then()
              }
              const updateParking: UpdateParkingInput = {
                id: parking.id,
                reserved: parking.reserved,
              }
              return from(this.parkingService.updateParking(updateParking)).pipe(switchMap(() => from(this.bookingRepository.save(booking))))
            }
            if(updateBookingInput.mountPaid) {
              const updateUser: UpdateUserInput = {
                id: previousBooking.user.id,
              }
              const user = previousBooking.user
              const priceWith80Percent = Math.round((booking.finalPrice * 80)/ 100 )
              const preFinalPrice = booking.finalPrice - priceWith80Percent
              if(priceWith80Percent <= user.wallet)
                updateUser.wallet = Math.round(user.wallet - preFinalPrice)
              else
                updateUser.wallet = 0

              this.userService.updateUser(updateUser).toPromise().then()
            }
            return from(this.bookingRepository.save(booking))
          }),
        );
      })
    )
  }
  getBookingPriceCalculated(bookingId: string) {
    return this.findBookingById(bookingId).pipe(
      switchMap((b) => {
        if(b.dateExtended) {
          const extendedMinutes = DateTime.fromJSDate(b.dateEnd).diff(DateTime.fromJSDate(b.dateExtended), ['minutes']).minutes
          return of(Math.round(b.initialPrice + (extendedMinutes * +b.parking.pricePerMinute)))
        }
        return of(Math.round(b.user.wallet + (b.initialPrice - b.finalPrice)))
      })
    )
  }
  findRecentBookingsFromBuildings(client: ClientEntity) {
    const customerQuery = this.bookingRepository.find({
      relations: {
        parking: {
          building: {
            client: true
          }
        }
      },
      where: {
        parking: {
          building: {
            client: {
              id: client.id
            }
          }
        }
      },
      order: {
        dateStart: "DESC"
      },
      take: 7
    })
    const adminQuery = this.bookingRepository.find({
      relations: {
        parking: {
          building: {
            client: true
          }
        }
      },
      order: {
        dateStart: "DESC"
      },
      take: 7
    })
    return client.userType >= UserTypesEnum.ADMIN ? adminQuery: customerQuery;
  }
  async findPaginatedBookings(pagination: PageOptionsDto, displayAll: boolean, parkingId: string, user: ClientEntity) {
    const query = this.bookingRepository.createQueryBuilder('b')
      .leftJoinAndSelect('b.parking', 'p')
      .leftJoinAndSelect('b.user', 'u')
      .where(
        user.userType < UserTypesEnum.ADMIN && displayAll ?
          `u.id = '${user.id}'::uuid`
          :
          ''
      )
      .skip(pagination.skip)
      .take(pagination.take);
    const itemCount = await query.getCount();
    const { entities } = await query.getRawAndEntities();
    const pageMetaDto = new PaginationMeta({ pageOptionsDto: pagination, itemCount });
    pageMetaDto.skip = (pageMetaDto.page - 1) * pageMetaDto.take;
    return new PageDto(entities, pageMetaDto);
  }
  findUnPaidBookings(userId: string) {
    if (!uuid.validate(userId)) {
      throw new UUIDBadFormatException();
    }
    return this.getUnPaidBookings(userId).pipe(
      map((t) => {
        if(!t)
          throw new NotFoundException()
        return t;
      })
    )
  }
  findBookingWithPaymentRequiredToStart(userId: string) {
    if (!uuid.validate(userId)) {
      throw new UUIDBadFormatException();
    }
    return this.getBookingsWithPaymentRequiredToStart(userId).pipe(
      map((t) => {
        if(!t)
          throw new NotFoundException()
        return t;
      })
    )
  }
  async findBookingsAndGetDailyIncomeAndPercentage() {
    const todayStart = DateTime.now().set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 1
    })
    const todayEnd = DateTime.now().set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999
    })
    const todayBookings = await this.bookingRepository.find({
      where: {
        dateStart: Between(todayStart.toJSDate(), todayEnd.toJSDate())
      }
    })
    const yesterdayStart = DateTime.now().minus({ day: 1 }).set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 1
    })
    const yesterdayEnd = DateTime.now().minus({ day: 1 }).set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999
    })
    const yesterdayBookings = await this.bookingRepository.find({
      where: {
        dateStart: Between(yesterdayStart.toJSDate(), yesterdayEnd.toJSDate())
      }
    })
    let todayIncome = 0;
    _.forEach(todayBookings, (b) => {
      todayIncome += b.finalPrice
    })
    let yesterdayIncome = 0;
    _.forEach(yesterdayBookings, (b) => {
      yesterdayIncome += b.finalPrice
    })
    const percentBetterFromYesterday = todayIncome === 0 && yesterdayIncome === 0 ? 0:Math.round(((todayIncome - yesterdayIncome) * 100)/(yesterdayIncome === 0 ? todayIncome: yesterdayIncome))
    return {
      percentBetterFromYesterday: percentBetterFromYesterday,
      numberOfIncomeToday: todayIncome
    } as BookingDailyIncomeFinance
  }
  async findBookingsMadeTodayAndYesterday() {
    const todayStart = DateTime.now().set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 1
    })
    const todayEnd = DateTime.now().set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999
    })
    const yesterdayStart = DateTime.now().minus({ day: 1 }).set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 1
    })
    const yesterdayEnd = DateTime.now().minus({ day: 1 }).set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999
    })
    const todayBookings = await this.bookingRepository.find({
      where: {
        dateStart: Between(todayStart.toJSDate(), todayEnd.toJSDate())
      }
    })
    const yesterdayBookings = await this.bookingRepository.find({
      where: {
        dateStart: Between(yesterdayStart.toJSDate(), yesterdayEnd.toJSDate())
      }
    })
    const totalYesterday = yesterdayBookings.length
    const totalToday = todayBookings.length
    const percentBetterFromYesterday = totalYesterday === 0 && totalToday === 0 ? 0:Math.round(((totalToday - totalYesterday) * 100)/(totalYesterday === 0 ? totalToday: totalYesterday))
    return {
      percentBetterFromYesterday: percentBetterFromYesterday,
      numberOfBookingToday: todayBookings.length
    } as BookingDailyFinance
  }
  getUnPaidBookings(userId: string) {
    return from(this.bookingRepository.find(
      {
        where: [
          {
            bookingState: BookingStatesEnum.FINALIZED,
            paid: false,
            user: {
              id: userId
            }
          },
          {
            bookingState: BookingStatesEnum.PAYMENT_REQUIRED,
            user: {
              id: userId
            }
          }
        ]
      }
    ))
  }
  getBookingsWithPaymentRequiredToStart(userId: string) {
    return from(this.bookingRepository.findOne(
      {
        where: {
          bookingState: BookingStatesEnum.PAYMENT_REQUIRED,
          user: {
            id: userId
          }
        }
      }
    ))
  }
  changeBookingParking(bookingId: string, parkingId: string): Observable<BookingEntity> {
    return this.parkingService.findParkingById(parkingId).pipe(
      switchMap((p) => {
        return this.findBookingById(bookingId).pipe(
          switchMap((b) => {
            b.parking = p;
            return from(this.bookingRepository.save(b))
          })
        )
      })
    )
  }
  changeBookingUser(bookingId: string, userId: string): Observable<BookingEntity> {
    return this.userService.findUserById(userId).pipe(
      switchMap((u) => {
        return this.findBookingById(bookingId).pipe(
          switchMap((b) => {
            b.user = u;
            return from(this.bookingRepository.save(b))
          })
        )
      })
    )
  }
  removeBooking(bookingId: string): Observable<BookingEntity> {
    if (!uuid.validate(bookingId)) {
      throw new UUIDBadFormatException();
    }
    return from(
      this.findBookingById(bookingId)
    ).pipe(
      switchMap((booking) => {
        return from(this.bookingRepository.remove([booking])).pipe(map((b) => b[0]));
      }),
    );
  }
  findBookingById(bookingId: string): Observable<BookingEntity> {
    if (!uuid.validate(bookingId)) {
      throw new UUIDBadFormatException();
    }
    return this.getBookingById(bookingId).pipe(
      map((t) => {
        if(!t)
          throw new NotFoundException()
        return t;
      })
    )
  }
  private createBookingCronJobForOneHourStartPlus5Minutes(booking: BookingEntity): void {
    const firstHourEnd = DateTime.fromJSDate(booking.dateStart).plus({hour: 1, minute: 5})
    this.createNewCron(DateTime.now(), firstHourEnd, BookingStatesEnum.RESERVED, booking.id)
  }
  private createBookingCronJobForPaying(booking: BookingEntity): void {
    const fiveMinutesToPay = DateTime.now().plus({minute: 6})
    this.createNewCron(DateTime.now(), fiveMinutesToPay, BookingStatesEnum.CANCELED, booking.id)
  }
  private findBookingsThatAreGoingToExpireIn3Days(shouldNotify: boolean) {
    return from(
      this.bookingRepository.createQueryBuilder('bookingEntity')
        .where(`DATE_PART('DAY', bookingEntity.dateEnd :: DATE) - DATE_PART('DAY', now() :: DATE) = 3`)
        .andWhere('bookingEntity.bookingType >= 1')
        .getMany()
    ).pipe(
      tap((b) => {
        if(shouldNotify) {
          const usersPhones = b.map((b) => b.user.phoneNumber)
          const usersEmails = b.map((b) => b.user.email)
          this.smsService.publishToArrayOfDestinations(usersPhones, BookingNotificationsEnum.RESERVATION_IS_GOING_TO_EXPIRE)
          this.emailService.publishEmailsToArrayOfDestinations(usersEmails, EmailTypesEnum.RESERVATION_IS_GOING_TO_EXPIRE)
        }
      })
    )
  }
  private findBookingsThatExpiresTodayAndUpdateTheirStatus(shouldNotify: boolean) {
    return from(
      this.bookingRepository.createQueryBuilder('bookingEntity')
        .where(`DATE_PART('DAY', bookingEntity.dateEnd :: DATE) - DATE_PART('DAY', now() :: DATE) <= -1`)
        .andWhere('bookingEntity.bookingType >= 1')
        .getMany()
    ).pipe(
      tap((b) => {
        if(shouldNotify) {
          let phones: string[] = []
          let emails: string[] = []
          b.forEach((b) => {
            if(b.bookingState === BookingStatesEnum.RESERVED) {
              emails.push(b.user.email)
              phones.push(b.user.phoneNumber)
            }
          })
          this.smsService.publishToArrayOfDestinations(phones, BookingNotificationsEnum.RESERVATION_IS_ALREADY_EXPIRED)
          this.emailService.publishEmailsToArrayOfDestinations(emails, EmailTypesEnum.RESERVATION_EXPIRED)
        }
      }),
      tap((bookings) => {
        bookings.forEach((b) => {
          if(b.bookingState !== BookingStatesEnum.CANCELED)
            b.bookingState = BookingStatesEnum.FINALIZED;
        })
        this.bookingRepository.save(bookings).then();
      })
    )
  }
  findActiveBookingsByUserId(userId: string) {
    if (!uuid.validate(userId)) {
      throw new UUIDBadFormatException();
    }
    return this.getActiveBookingsByUserId(userId)
  }
  getActiveBookingsByUserId(userId: string) {
    return from(
      this.bookingRepository.find({
          where: {
            bookingState: BookingStatesEnum.RESERVED,
            user: {
              id: userId
            }
          }
        }
      ))
  }
  resetCronJobsForBookingId(bookingId: string) {
    return this.findBookingById(bookingId).pipe(
      switchMap((b) => {
        return this.cronService.findCronByBookingIdAndExecuteFalse(b.id).pipe(
          switchMap((c) => {
            if(c) {
              c.executed = true
              if(this.scheduler.doesExist('cron', bookingId)) {
                this.scheduler.deleteCronJob(bookingId)
              }
              return from(this.cronService.saveCron(c)).pipe(
                tap(() => {
                  this.createBookingCronJobForPaying(b)
                }),
                map(() => {
                  return true
                })
              )
            }
            return of(false)
          })
        )
      })
    )
  }
  private getBookingsForParkingIdByDateRange(parkingId: string, dateStart: Date, dateEnd: Date) : Observable<BookingEntity[] | null> {
    return from(
      this.bookingRepository.find(
        {
          where: {
            parking: {
              id: parkingId
            },
            dateStart: Between(dateStart, dateEnd),
            dateEnd: Between(dateStart, dateEnd)
          }
        }
      )
    )
  }
  private getBookingById(bookingId: string) : Observable<BookingEntity | null> {
    return from(
      this.bookingRepository.findOne(
        {
          where: {
            id: bookingId
          }
        }
      )
    )
  }
  async loadCronsFromRepository() {
    const jobs = await this.cronService.loadAllCronJobsFromCronRepository()
    jobs.forEach((j) => {
      if(DateTime.fromJSDate(j.dateEnd).toMillis() <= DateTime.now().toMillis()) {
        this.executeStateChangeFromBooking(j)
        return;
      }
      if(DateTime.fromJSDate(j.dateStart).toMillis() <= DateTime.now().toMillis() && DateTime.now().toMillis() <= DateTime.fromJSDate(j.dateEnd).toMillis()) {
        this.createCronExisting(j, DateTime.now(), DateTime.fromJSDate(j.dateEnd), j.stateWhenEnd, j.bookingId);
        return;
      }
      if(DateTime.now().toMillis() < DateTime.fromJSDate(j.dateStart).toMillis()) {
        this.createCronExisting(j, DateTime.fromJSDate(j.dateStart), DateTime.fromJSDate(j.dateEnd), j.stateWhenEnd, j.bookingId);
      }
    })
  }
  async createCronExisting(cron: CronEntity, dateStart: DateTime, dateEnd: DateTime, stateWhenEnd: BookingStatesEnum, bookingId: string, dateExtended?: boolean): Promise<void> {
    const hasPreviousJob = this.scheduler.doesExist("cron",bookingId)
    if(hasPreviousJob) {
      this.scheduler.deleteCronJob(bookingId)
      await this.cronService.deleteCronByBookingId(bookingId)
    }
    const job = new CronJob
    (dateEnd.toJSDate(), () => {job.stop()},
      async () => {
        this.executeStateChangeFromBooking(cron, dateExtended)
      }, false, Settings.defaultZone.name)
    job.start();
    this.scheduler.addCronJob(bookingId, job)
  }
  async createNewCron(dateStart: DateTime, dateEnd: DateTime, stateWhenEnd: BookingStatesEnum, bookingId: string, dateExtended?: boolean): Promise<void> {
    const hasPreviousJob = this.scheduler.doesExist("cron",bookingId)
    if(hasPreviousJob) {
      this.scheduler.deleteCronJob(bookingId)
      await this.cronService.deleteCronByBookingId(bookingId)
    }
    const cron = await this.cronService.createCron(dateStart, dateEnd, stateWhenEnd, bookingId)
    const job = new CronJob
    (dateEnd.toJSDate(), () => {job.stop()},
      async () => {
        this.executeStateChangeFromBooking(cron, dateExtended)
      }, false, Settings.defaultZone.name)
    job.start();
    this.scheduler.addCronJob(bookingId, job)
  }
  async executeStateChangeFromBooking(cron: CronEntity, dateExtended?: boolean) {
    const updateBookingInput: UpdateBookingInput = {
      id: cron.bookingId,
      bookingState: cron.stateWhenEnd
    }
    const book = await this.findBookingById(cron.bookingId).toPromise();
    if(dateExtended){
      updateBookingInput.dateExtended = DateTime.now().toJSDate()
    }else if(cron.stateWhenEnd === BookingStatesEnum.RESERVED && book && book.bookingState === BookingStatesEnum.RESERVED) {
      if(book && book.dateEnd && DateTime.fromJSDate(book.dateEnd).toMillis() <= DateTime.now().toMillis()) {
        updateBookingInput.dateExtended = book.dateEnd;
      }
    }
    await this.updateBooking(updateBookingInput).toPromise().then()
    cron.executed = true
    await this.cronService.saveCron(cron).then()
  }
}
