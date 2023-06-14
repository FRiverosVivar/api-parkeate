import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BookingEntity } from "../entity/booking.entity";
import { Between, Not, Repository } from "typeorm";
import { forkJoin, from, map, Observable, switchMap, tap } from "rxjs";
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
  ) {}
  onModuleInit(): any {
    Settings.defaultZone = 'America/Santiago';
    this.checkMonthlyAndYearlyReservations()
  }
  @Cron(CronExpression.EVERY_DAY_AT_5AM, {
    name: 'checkMonthlyAndYearlyReservations',
  })
  private checkMonthlyAndYearlyReservations(): void {
    const shouldNotify = true
    this.findBookingsThatExpiresTodayAndUpdateTheirStatus(shouldNotify);
    this.findBookingsThatAreGoingToExpireIn3Days(shouldNotify);
  }

  createBooking(createBookingInput: CreateBookingInput, parkingId: string, userId: string): Observable<BookingEntity> {
    const booking = this.bookingRepository.create(createBookingInput);
    const parking = this.parkingService.findParkingById(parkingId)
    const user = this.userService.findUserById(userId)
    return this.getBookingsForParkingIdByDateRange(parkingId, createBookingInput.dateStart, createBookingInput.dateEnd)
      .pipe(switchMap((bookings) => {
          if(bookings && bookings.length > 0)
            throw new ExistingBookingDateException();

        return forkJoin([parking,user]).pipe(
          switchMap(([parking,user]) => {
            booking.parking = parking;
            booking.user = user;
            this.createBookingCronJobForOneHourStartPlus5Minutes(booking)
            return from(this.bookingRepository.save(booking))
          }));
      })
    )
  }
  updateBooking(updateBookingInput: UpdateBookingInput, parkingId: string, userId: string): Observable<BookingEntity> {
    const parking = this.parkingService.findParkingById(parkingId)
    const user = this.userService.findUserById(userId)
    return from(
      this.bookingRepository.preload({
        ...updateBookingInput,
      }),
    ).pipe(
      switchMap((booking) => {
        if (!booking) {
          throw new NotFoundException();
        }
        return forkJoin([parking,user]).pipe(
          switchMap(([p, u]) => {
            if(booking.parking.id !== p.id)
              booking.parking = p;
            if(booking.user.id !== u.id)
              booking.user = u;
            if(booking.bookingState === BookingStatesEnum.FINALIZED) {
              const job = this.scheduler.getCronJob(booking.id)
              if(job.running) {
                job.stop();
              }
            }
            return from(this.bookingRepository.save(booking))
          })
        );
      }),
    );
  }
  removeBooking(bookingId: string): Observable<BookingEntity> {
    if (uuid.validate(bookingId)) {
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
    if (uuid.validate(bookingId)) {
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
    const job = new CronJob
    (firstHourEnd, () => {},
      async () => {
        const dateExtended = DateTime.now().toJSDate();
        const book = await this.bookingRepository.findOne({ where: {id: booking.id }})
        if(book) {
          book.dateExtended = dateExtended;
          await this.bookingRepository.save(book)
        }
      })
    this.scheduler.addCronJob(booking.id, job)
  }

  private findBookingsThatAreGoingToExpireIn3Days(shouldNotify: boolean) {
    const today = new Date();
    return from(
      this.bookingRepository.createQueryBuilder('bookingEntity')
        .where('DATEDIFF(day, bookingEntity.dateEnd, :today) = 3')
        .andWhere('bookingEntity.bookingType >= 1')
        .setParameter('today', today)
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
    const today = new Date();
    return from(
      this.bookingRepository.createQueryBuilder('bookingEntity')
        .where('DATEDIFF(day, bookingEntity.dateEnd, :today) = 0')
        .andWhere('bookingEntity.bookingType >= 1')
        .setParameter('today', today)
        .getMany()
    ).pipe(
      tap((b) => {
        if(shouldNotify) {
          const usersPhones = b.map((b) => b.user.phoneNumber)
          const usersEmails = b.map((b) => b.user.email)
          this.smsService.publishToArrayOfDestinations(usersPhones, BookingNotificationsEnum.RESERVATION_IS_GOING_TO_EXPIRE)
          this.emailService.publishEmailsToArrayOfDestinations(usersEmails, EmailTypesEnum.RESERVATION_IS_GOING_TO_EXPIRE)
        }
      }),
      tap((bookings) => {
        bookings.forEach((b) => {
          b.bookingState = BookingStatesEnum.FINALIZED;
        })
        this.bookingRepository.save(bookings).then();
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
            dateStart: Not(Between(dateStart, dateEnd)),
            dateEnd: Not(Between(dateStart, dateEnd))
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
}