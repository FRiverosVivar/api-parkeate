import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BookingEntity } from "../entity/booking.entity";
import { Between, LessThan, MoreThan, Repository } from "typeorm";
import { combineLatestWith, forkJoin, from, map, Observable, of, switchMap, tap } from "rxjs";
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
    Settings.defaultZone = 'America/Santiago';
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
              const job = this.scheduler.getCronJob(booking.id)
              booking.dateEnd = DateTime.now().toJSDate();
              parking.reserved = false;
              if(job.running) {
                job.stop();
                return this.cronService.findCronByBookingIdAndExecuteFalse(booking.id)
                  .pipe(
                    switchMap((c) => {
                      c.executed = true
                      return this.cronService.saveCron(c)
                    }),
                    switchMap((c) => {
                      return from(this.bookingRepository.save(booking))
                    })
                  )
              }
            }

            if(previousBooking.bookingState === BookingStatesEnum.PAYMENT_REQUIRED && booking.bookingState === BookingStatesEnum.RESERVED) {

              if(booking.bookingType === BookingTypesEnum.MONTHLY_BOOKING)
                booking.dateEnd = DateTime.now().plus({days: 30}).toJSDate()
              else {
                booking.dateEnd = DateTime.now().plus({hour: 1, minutes: 5}).toJSDate()
                this.createBookingCronJobForOneHourStartPlus5Minutes(booking);
              }

              booking.dateStart = DateTime.now().toJSDate()
              parking.reserved = true;
            }

            if(previousBooking.bookingState === BookingStatesEnum.RESERVED && booking.bookingState === BookingStatesEnum.FINALIZED && booking.bookingType === BookingTypesEnum.NORMAL_BOOKING) {
              if(!booking.dateExtended){
                const extendedMinutes = DateTime.fromJSDate(booking.dateExtended).diff(DateTime.fromJSDate(booking.dateEnd)).minutes
                booking.finalPrice = booking.initialPrice + (extendedMinutes * +booking.parking.pricePerMinute)
              }else {
                const minutesStayed = DateTime.fromJSDate(booking.dateEnd).diff(DateTime.fromJSDate(booking.dateStart)).minutes
                booking.finalPrice = (minutesStayed * +booking.parking.pricePerMinute)
                const updateUser: UpdateUserInput = {
                  id: booking.user.id,
                  wallet: booking.user.wallet + (booking.initialPrice - booking.finalPrice)
                }
                this.userService.updateUser(updateUser).toPromise().then()
              }
            }
            const updateParking: UpdateParkingInput = {
              id: parking.id,
              reserved: parking.reserved,
            }
            return from(this.parkingService.updateParking(updateParking)).pipe(switchMap(() => from(this.bookingRepository.save(booking))))
          }),
        );
      })
    )

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
    const firstHourEnd = DateTime.fromJSDate(booking.dateStart).plus({hour:1,minute: 5})
    this.createCron(DateTime.now(), firstHourEnd, BookingStatesEnum.RESERVED, booking.id)
  }
  private createBookingCronJobForPaying(booking: BookingEntity): void {
    const fiveMinutesToPay = DateTime.now().plus({minute: 5})
    this.createCron(DateTime.now(), fiveMinutesToPay, BookingStatesEnum.CANCELED, booking.id)
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
  findActiveBookingByUserId(userId: string) {
    if (!uuid.validate(userId)) {
      throw new UUIDBadFormatException();
    }
    return this.getActiveBookingByUserId(userId)
  }
  getActiveBookingByUserId(userId: string) {
    let iso = DateTime.now().toISO()
    if(!iso) return of(null);

    iso = iso.replace('T', ' ')
    iso = iso.replace('Z', '-04')
    return from(
      this.bookingRepository.createQueryBuilder('bookingEntity')
        .leftJoin('bookingEntity.parking', 'parkingEntity')
        .where(`bookingEntity.userId = '${userId}':: uuid`)
        .andWhere(`bookingEntity.dateStart < '${iso}' ::timestamptz`)
        .andWhere(`bookingEntity.dateEnd > '${iso}' ::timestamptz`)
        .getOne())
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
        this.createCron(DateTime.now(), DateTime.fromJSDate(j.dateEnd), j.stateWhenEnd, j.bookingId);
        return;
      }
      if(DateTime.now().toMillis() < DateTime.fromJSDate(j.dateStart).toMillis()) {
        this.createCron(DateTime.fromJSDate(j.dateStart), DateTime.fromJSDate(j.dateEnd), j.stateWhenEnd, j.bookingId);
      }
    })
  }
  async createCron(dateStart: DateTime, dateEnd: DateTime, stateWhenEnd: BookingStatesEnum, bookingId: string, dateExtended?: boolean): Promise<void> {
    const hasPreviousJob = this.scheduler.doesExist("cron",bookingId)
    if(hasPreviousJob) {
      console.log(hasPreviousJob)
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

    if(dateExtended)
      updateBookingInput.dateExtended = DateTime.now().toJSDate()

    await this.updateBooking(updateBookingInput).toPromise().then()
    cron.executed = true
    await this.cronService.saveCron(cron).then()
  }
}
