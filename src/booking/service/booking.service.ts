import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BookingEntity } from "../entity/booking.entity";
import {
  Between,
  Equal,
  In,
  IsNull,
  MoreThanOrEqual,
  Not,
  Repository,
} from "typeorm";
import {
  combineLatest,
  forkJoin,
  from,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap
} from "rxjs";
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
import { DateTime, Duration, Settings } from "luxon";
import { CronJob } from "cron";
import { BookingTypesEnum } from "../enum/booking-types.enum";
import { UpdateUserInput } from "../../user/model/dto/update-user.input";
import { CronService } from "../../utils/cron/cron.service";
import { CronEntity } from "../../utils/cron/entity/cron.entity";
import { UpdateParkingInput } from "../../parking/model/update-parking.input";
import {
  PageDto,
  PageOptionsDto,
  PaginationMeta,
} from "../../utils/interfaces/pagination.type";
import { ClientEntity } from "../../client/entity/client.entity";
import { UserTypesEnum } from "../../user/constants/constants";
import {
  BookingDailyFinance,
  BookingDailyIncomeFinance,
} from "../model/finance-booking.output";
import { HttpService } from "@nestjs/axios";
import * as _ from "lodash";
import { PaykuModel, PaykuResponse } from "../model/payku-model.input";
import { BookingPriceCalculated } from "../model/booking-calculate-price.output";
import { CryptService } from "src/utils/crypt/crypt.service";
import { CouponService } from "src/coupons/service/coupon.service";
import { UserCouponEntity } from "src/coupons/user-coupons/entity/user-coupons.entity";
import { UpdateUserCouponInput } from "src/coupons/model/update-user-coupon.input";
import { getBookingDataForNewBookingEmailTemplate } from "src/utils/utils";
import { VehicleService } from "src/vehicle/service/vehicle.service";
import { VehicleEntity } from "src/vehicle/entity/vehicle.entity";
import { CronExpressionExtendedEnum } from "src/utils/cron/cron-expression-extended.enum";
import { InAdvanceBooking } from "../enum/in-advance-booking.enum";
import { NotificationService } from "src/utils/notification/notification.service";
import { ParkingType } from "../../parking/model/parking-type.enum";
import { CouponsTypeEnum } from "../../coupons/constants/coupons-type.enum";
import { ParkingEntity } from "../../parking/entity/parking.entity";
import { CurrentPriceBookingOutput } from "../model/current-price-booking.output";

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
    private readonly httpService: HttpService,
    private readonly crypto: CryptService,
    private readonly couponService: CouponService,
    private readonly vehicleService: VehicleService,
    private readonly notificationService: NotificationService
  ) {}
  @Cron(CronExpression.EVERY_DAY_AT_5AM, {
    name: "checkMonthlyAndYearlyReservations",
  })
  private checkMonthlyAndYearlyReservations(): void {
    const shouldNotify = true;
    this.findBookingsThatExpiresTodayAndUpdateTheirStatus(shouldNotify);
    this.findBookingsThatAreGoingToExpireIn3Days(shouldNotify);
  }

  onModuleInit(): any {
    Settings.defaultZone = "America/Santiago";
    this.checkMonthlyAndYearlyReservations();
    this.loadCronsFromRepository();
  }
  @Cron(CronExpressionExtendedEnum.EVERY_15_MINUTES)
  private async checkAnticipatedBookings() {
    const bookings = await this.bookingRepository.findBy({
      bookingState: BookingStatesEnum.IN_ADVANCE_RESERVED,
    });
    const now = DateTime.now();
    const notify = [];
    const bookingsToUpdate = [];
    bookings: for (let booking of bookings) {
      const bookingCurrentMinutesUntilStartState =
        this.determineRemainingMinutesFromBooking(
          now,
          DateTime.fromJSDate(booking.dateStart)
        );
      console.log(booking);
      console.log(bookingCurrentMinutesUntilStartState);
      if (
        booking.lastestNotifiedState !== bookingCurrentMinutesUntilStartState &&
        bookingCurrentMinutesUntilStartState !== InAdvanceBooking.IGNORE
      ) {
        if (
          bookingCurrentMinutesUntilStartState ===
          InAdvanceBooking.STATE_TO_RESERVED
        ) {
          const updateBooking: UpdateBookingInput = {
            id: booking.id,
            bookingState: BookingStatesEnum.RESERVED,
          };
          await this.updateBooking(updateBooking).toPromise();
        }
        booking.lastestNotifiedState = bookingCurrentMinutesUntilStartState;
        notify.push(booking.user.id);
        bookingsToUpdate.push(booking);
      }
    }
    if (notify.length > 0)
      this.notificationService.sendNotificationToListOfUsers(
        notify,
        "Reserva Anticipada",
        "Tu reserva está próxima a comenzar!"
      );
    if (bookingsToUpdate.length > 0)
      this.bookingRepository.save(
        bookingsToUpdate
          .filter((b) => b.lastestNotifiedState !== InAdvanceBooking.IGNORE)
          .filter(
            (b) => b.lastestNotifiedState !== InAdvanceBooking.STATE_TO_RESERVED
          )
      );
    console.log(bookingsToUpdate);
    console.log(notify);
  }
  private determineRemainingMinutesFromBooking(
    now: DateTime,
    dateStart: DateTime
  ) {
    const minutes = dateStart.diff(now, "minutes").minutes;
    switch (true) {
      case minutes <= 0: {
        return InAdvanceBooking.STATE_TO_RESERVED;
      }
      case minutes < 15: {
        return InAdvanceBooking.LESS_THAN_15;
      }
      case minutes < 30 && minutes > 15: {
        return InAdvanceBooking.LESS_THAN_30;
      }
      case minutes < 60 && minutes > 30: {
        return InAdvanceBooking.LESS_THAN_60;
      }
      case minutes < 180 && minutes > 60: {
        return InAdvanceBooking.LESS_THAN_180;
      }
      case minutes < 360 && minutes > 180: {
        return InAdvanceBooking.LESS_THAN_360;
      }
      case minutes < 1440 && minutes > 360: {
        return InAdvanceBooking.LESS_THAN_1440;
      }
      case minutes < 10080 && minutes > 1440: {
        return InAdvanceBooking.LESS_THAN_10080;
      }
    }
    return InAdvanceBooking.IGNORE;
  }
  async getBookingCountForOrderNumberAndCreatePaykuOrder(
    paykuModel: PaykuModel
  ) {
    let order = (
      await this.bookingRepository.query(
        `select count(id)+1 as order_number from booking`
      )
    )[0].order_number;
    if (paykuModel.order) {
      order = +`${paykuModel.order}${order}`;
    }
    paykuModel.order = order;
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer tkpu25bfea3a4e6a2ea96257103f9d89",
    };
    const response = await this.httpService
      .post("https://app.payku.cl/api/transaction", paykuModel, {
        headers: headers,
      })
      .toPromise();
    if (response) {
      const paykuResponse: PaykuResponse = {
        ...response.data,
      };
      return paykuResponse;
    }
    return undefined;
  }
  createBooking(
    createBookingInput: CreateBookingInput,
    parkingId: string,
    userId: string,
    vehicleId?: string,
    selectedDate?: string
  ): Observable<BookingEntity> {
    let vehicle: Observable<VehicleEntity | null> = of(null);
    if (vehicleId) vehicle = this.vehicleService.getVehicleById(vehicleId);
    const booking = this.bookingRepository.create(createBookingInput);
    if (selectedDate) {
      booking.anticipatedBooking = true;
      const date = DateTime.fromISO(selectedDate);
      booking.lastestNotifiedState = this.determineRemainingMinutesFromBooking(
        DateTime.now(),
        date
      );
    }
    const parking = this.parkingService.findParkingById(parkingId);
    const user = this.userService.findUserById(userId);
    return this.getBookingsForParkingIdByDateRange(
      parkingId,
      DateTime.fromISO(createBookingInput.dateStart).toJSDate(),
      DateTime.fromISO(createBookingInput.dateStart)
        .plus({ hour: 1, minutes: 5 })
        .toJSDate()
    ).pipe(
      switchMap((bookings) => {
        if (bookings && bookings.length > 0) {
          throw new ExistingBookingDateException();
        }
        this.emailService
          .sendEmail(
            EmailTypesEnum.CODE,
            "zekropls@gmail.com",
            `{"name":"123"}`
          )
          .then();
        return forkJoin([parking, user, vehicle]).pipe(
          switchMap(([parking, user, v]) => {
            if (v) booking.vehicle = v;
            booking.parking = parking;
            booking.user = user;
            booking.dateStart = selectedDate
              ? DateTime.fromISO(selectedDate).toJSDate()
              : DateTime.now().toJSDate();
            booking.dateEnd = selectedDate
              ? DateTime.fromISO(selectedDate).plus({ minutes: 5 }).toJSDate()
              : DateTime.now().plus({ minutes: 5 }).toJSDate();
            return from(this.bookingRepository.save(booking)).pipe(
              tap((b) => {
                if (booking.bookingState === BookingStatesEnum.PAYMENT_REQUIRED)
                  this.createBookingCronJobForPaying(booking);
              })
            );
          })
        );
      })
    );
  }
  updateBooking(
    updateBookingInput: UpdateBookingInput
  ): Observable<BookingEntity> {
    const booking$ = this.findBookingById(updateBookingInput.id, {
      relations: {
        parking: {
          building: true,
        },
        vehicle: true,
      },
    });
    return booking$.pipe(
      switchMap((previousBooking) => {
        return from(
          this.bookingRepository.preload({
            ...updateBookingInput,
          })
        ).pipe(
          switchMap((booking) => {
            console.log("a");
            if (!booking) {
              throw new NotFoundException();
            }
            const parking = previousBooking.parking;
            if (booking.bookingState === BookingStatesEnum.FINALIZED) {
              console.log("b");

              booking.dateEnd = DateTime.now().toJSDate();
              parking.reserved = false;
              console.log("c");
              const parkingInput: UpdateParkingInput = {
                id: parking.id,
                reserved: false,
              };
              this.parkingService
                .updateParking(parkingInput)
                .toPromise()
                .then();
              if (this.scheduler.doesExist("cron", booking.id)) {
                console.log("exists job");
                const job = this.scheduler.getCronJob(booking.id);
                console.log(job);
                if (job) {
                  this.scheduler.getCronJobs().delete(booking.id);
                }
                this.cronService
                  .findCronByBookingIdAndExecuteFalse(booking.id)
                  .pipe(
                    switchMap((c) => {
                      if (!c) return of(null);
                      c.executed = true;
                      return this.cronService.saveCron(c);
                    })
                  )
                  .toPromise()
                  .then();
              }
            }

            if (
              (previousBooking.bookingState ===
                BookingStatesEnum.PAYMENT_REQUIRED ||
                previousBooking.bookingState ===
                  BookingStatesEnum.IN_ADVANCE_RESERVED) &&
              booking.bookingState === BookingStatesEnum.RESERVED
            ) {
              console.log("f");
              booking.dateStart = DateTime.now().toJSDate();
              if (booking.bookingType === BookingTypesEnum.MONTHLY_BOOKING) {
                booking.dateEnd = DateTime.now().plus({ days: 30 }).toJSDate();
                booking.paid = true;
              } else {
                booking.dateEnd = DateTime.now()
                  .plus({ hour: 1, minutes: 5 })
                  .toJSDate();
                this.createBookingCronJobForOneHourStartPlus5Minutes(booking);
              }

              parking.reserved = true;
              console.log("g");

              const updateParking: UpdateParkingInput = {
                id: parking.id,
                reserved: parking.reserved,
              };
              console.log(parking.contactEmail);
              if (parking.contactEmail) {
                return forkJoin([
                  from(
                    this.emailService.sendEmail(
                      EmailTypesEnum.RESERVATION_CREATED,
                      parking.contactEmail,
                      JSON.stringify(
                        getBookingDataForNewBookingEmailTemplate(
                          parking.building,
                          parking,
                          booking,
                          previousBooking.user,
                          previousBooking.vehicle
                        )
                      )
                    )
                  ),
                  from(this.parkingService.updateParking(updateParking)),
                ]).pipe(
                  switchMap(([s, parking]) => {
                    console.log(s);
                    return from(this.bookingRepository.save(booking));
                  })
                );
              }

              return from(
                this.parkingService.updateParking(updateParking)
              ).pipe(
                switchMap(() => from(this.bookingRepository.save(booking)))
              );
            } else if (
              previousBooking.bookingState ===
                BookingStatesEnum.PAYMENT_REQUIRED &&
              booking.bookingState === BookingStatesEnum.IN_ADVANCE_RESERVED
            ) {
              const now = DateTime.now();
              const diff = DateTime.fromJSDate(booking.dateStart).diff(
                now,
                "days"
              ).days;
              if (diff === 0) {
                parking.reserved = true;
                console.log("abcdef111");

                const updateParking: UpdateParkingInput = {
                  id: parking.id,
                  reserved: parking.reserved,
                };
                console.log(parking.contactEmail);
                if (parking.contactEmail) {
                  return forkJoin([
                    from(
                      this.emailService.sendEmail(
                        EmailTypesEnum.RESERVATION_CREATED,
                        parking.contactEmail,
                        JSON.stringify(
                          getBookingDataForNewBookingEmailTemplate(
                            parking.building,
                            parking,
                            booking,
                            previousBooking.user,
                            previousBooking.vehicle
                          )
                        )
                      )
                    ),
                    from(this.parkingService.updateParking(updateParking)),
                  ]).pipe(
                    switchMap(([s, parking]) => {
                      console.log(s);
                      return from(this.bookingRepository.save(booking));
                    })
                  );
                }
              }
            }

            return from(this.bookingRepository.save(booking));
          })
        );
      })
    );
  }
  getBookingPriceCalculated(bookingId: string) {
    return this.findBookingById(bookingId).pipe(
      switchMap((b) => {
        if (b.dateExtended) {
          const extendedMinutes = DateTime.now().diff(
            DateTime.fromJSDate(b.dateExtended),
            ["minutes"]
          ).minutes;
          const initialAmountToBePaid = Math.round(
            extendedMinutes * +b.parking.pricePerMinute
          );
          const priceWith80Percent = Math.round(
            (initialAmountToBePaid * 80) / 100
          );
          let finalPriceToBePaid = 0;
          let discount = 0;
          if (b.user.wallet >= priceWith80Percent) {
            discount = priceWith80Percent;
            finalPriceToBePaid = Math.round(initialAmountToBePaid - discount);
          } else {
            discount = b.user.wallet;
            finalPriceToBePaid = Math.round(
              initialAmountToBePaid - b.user.wallet
            );
          }

          return of({
            priceToBePaid: finalPriceToBePaid,
            discount: discount,
            originalPrice: initialAmountToBePaid,
          } as BookingPriceCalculated);
        }
        return of({
          priceToBePaid: Math.round(b.initialPrice - b.finalPrice),
          discount: 0,
          originalPrice: Math.round(b.initialPrice - b.finalPrice),
        } as BookingPriceCalculated);
      })
    );
  }
  findRecentBookingsFromBuildings(client: ClientEntity) {
    const customerQuery = this.bookingRepository.find({
      relations: {
        parking: {
          building: {
            client: true,
          },
        },
      },
      where: {
        parking: {
          building: {
            client: {
              id: client.id,
            },
          },
        },
      },
      order: {
        dateStart: "DESC",
      },
      take: 7,
    });
    const adminQuery = this.bookingRepository.find({
      relations: {
        parking: {
          building: {
            client: true,
          },
        },
      },
      order: {
        dateStart: "DESC",
      },
      take: 7,
    });
    return client.userType >= UserTypesEnum.ADMIN ? adminQuery : customerQuery;
  }
  async findPaginatedBookings(
    pagination: PageOptionsDto,
    displayAll: boolean,
    parkingId: string,
    user: ClientEntity
  ) {
    const query = this.bookingRepository
      .createQueryBuilder("b")
      .leftJoinAndSelect("b.parking", "p")
      .leftJoinAndSelect("b.user", "u")
      .leftJoinAndSelect("b.vehicle", "v")
      .where(
        user.userType < UserTypesEnum.ADMIN && displayAll
          ? `u.id = '${user.id}'::uuid`
          : ""
      )
      .andWhere(parkingId ? `p.id = '${parkingId}'::uuid` : "")
      .skip(pagination.skip)
      .take(pagination.take);
    const itemCount = await query.getCount();
    const { entities } = await query.getRawAndEntities();
    const pageMetaDto = new PaginationMeta({
      pageOptionsDto: pagination,
      itemCount,
    });
    pageMetaDto.skip = (pageMetaDto.page - 1) * pageMetaDto.take;
    return new PageDto(entities, pageMetaDto);
  }
  findUnPaidBookings(userId: string) {
    if (!uuid.validate(userId)) {
      throw new UUIDBadFormatException();
    }
    return this.getUnPaidBookings(userId).pipe(
      map((t) => {
        if (!t) throw new NotFoundException();
        return t;
      })
    );
  }
  findBookingWithPaymentRequiredToStart(userId: string) {
    if (!uuid.validate(userId)) {
      throw new UUIDBadFormatException();
    }
    return this.getBookingsWithPaymentRequiredToStart(userId).pipe(
      map((t) => {
        if (!t) throw new NotFoundException();
        return t;
      })
    );
  }
  async findBookingsAndGetDailyIncomeAndPercentage() {
    const todayStart = DateTime.now().set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 1,
    });
    const todayEnd = DateTime.now().set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    });
    const todayBookings = await this.bookingRepository.find({
      where: {
        dateStart: Between(todayStart.toJSDate(), todayEnd.toJSDate()),
      },
    });
    const yesterdayStart = DateTime.now().minus({ day: 1 }).set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 1,
    });
    const yesterdayEnd = DateTime.now().minus({ day: 1 }).set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    });
    const yesterdayBookings = await this.bookingRepository.find({
      where: {
        dateStart: Between(yesterdayStart.toJSDate(), yesterdayEnd.toJSDate()),
      },
    });
    let todayIncome = 0;
    _.forEach(todayBookings, (b) => {
      todayIncome += b.finalPrice;
    });
    let yesterdayIncome = 0;
    _.forEach(yesterdayBookings, (b) => {
      yesterdayIncome += b.finalPrice;
    });
    const percentBetterFromYesterday =
      todayIncome === 0 && yesterdayIncome === 0
        ? 0
        : Math.round(
            ((todayIncome - yesterdayIncome) * 100) /
              (yesterdayIncome === 0 ? todayIncome : yesterdayIncome)
          );
    return {
      percentBetterFromYesterday: percentBetterFromYesterday,
      numberOfIncomeToday: todayIncome,
    } as BookingDailyIncomeFinance;
  }
  async findBookingsMadeTodayAndYesterday() {
    const todayStart = DateTime.now().set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 1,
    });
    const todayEnd = DateTime.now().set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    });
    const yesterdayStart = DateTime.now().minus({ day: 1 }).set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 1,
    });
    const yesterdayEnd = DateTime.now().minus({ day: 1 }).set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    });
    const todayBookings = await this.bookingRepository.find({
      where: {
        dateStart: Between(todayStart.toJSDate(), todayEnd.toJSDate()),
      },
    });
    const yesterdayBookings = await this.bookingRepository.find({
      where: {
        dateStart: Between(yesterdayStart.toJSDate(), yesterdayEnd.toJSDate()),
      },
    });
    const totalYesterday = yesterdayBookings.length;
    const totalToday = todayBookings.length;
    const percentBetterFromYesterday =
      totalYesterday === 0 && totalToday === 0
        ? 0
        : Math.round(
            ((totalToday - totalYesterday) * 100) /
              (totalYesterday === 0 ? totalToday : totalYesterday)
          );
    return {
      percentBetterFromYesterday: percentBetterFromYesterday,
      numberOfBookingToday: todayBookings.length,
    } as BookingDailyFinance;
  }
  getBookingsByClientId(clientId: string) {
    return this.bookingRepository.find({
      relations: {
        parking: {
          client: true,
          building: true,
        },
      },
      where: {
        parking: {
          client: {
            id: clientId,
          },
        },
        bookingState: BookingStatesEnum.FINALIZED,
        finalPrice: Not(IsNull()),
      },
    });
  }
  getUnPaidBookings(userId: string) {
    return from(
      this.bookingRepository.find({
        where: [
          {
            bookingState: BookingStatesEnum.FINALIZED,
            paid: false,
            user: {
              id: userId,
            },
          },
          {
            bookingState: BookingStatesEnum.PAYMENT_REQUIRED,
            user: {
              id: userId,
            },
          },
        ],
      })
    );
  }
  getBookingsWithPaymentRequiredToStart(userId: string) {
    return from(
      this.bookingRepository.findOne({
        where: {
          bookingState: BookingStatesEnum.PAYMENT_REQUIRED,
          user: {
            id: userId,
          },
        },
      })
    );
  }
  changeBookingParking(
    bookingId: string,
    parkingId: string
  ): Observable<BookingEntity> {
    return this.parkingService.findParkingById(parkingId).pipe(
      switchMap((p) => {
        return this.findBookingById(bookingId).pipe(
          switchMap((b) => {
            const oldParking = b.parking;
            b.parking = p;
            const updateParking = {
              id: oldParking.id,
              reserved: false,
            }
            const updateNewParking = {
              id: p.id,
              reserved: true,
            }

            return combineLatest([
                this.parkingService.updateParking(updateParking),
                this.parkingService.updateParking(updateNewParking),
            ]).pipe(
                switchMap(() => {
                  return from(this.bookingRepository.save(b))
                })
              )
            })
        );
      })
    );
  }
  changeBookingUser(
    bookingId: string,
    userId: string
  ): Observable<BookingEntity> {
    return this.userService.findUserById(userId).pipe(
      switchMap((u) => {
        return this.findBookingById(bookingId).pipe(
          switchMap((b) => {
            b.user = u;
            return from(this.bookingRepository.save(b));
          })
        );
      })
    );
  }
  removeBooking(bookingId: string): Observable<BookingEntity> {
    if (!uuid.validate(bookingId)) {
      throw new UUIDBadFormatException();
    }
    return from(this.findBookingById(bookingId)).pipe(
      switchMap((booking) => {
        return from(this.bookingRepository.remove([booking])).pipe(
          map((b) => b[0])
        );
      })
    );
  }
  findBookingById(
    bookingId: string,
    relations?: any
  ): Observable<BookingEntity> {
    if (!uuid.validate(bookingId)) {
      throw new UUIDBadFormatException();
    }
    return this.getBookingById(bookingId, relations).pipe(
      map((t) => {
        if (!t) throw new NotFoundException();
        return t;
      })
    );
  }
  private createBookingCronJobForOneHourStartPlus5Minutes(
    booking: BookingEntity
  ): void {
    const firstHourEnd = DateTime.fromJSDate(booking.dateStart).plus({
      hour: 1,
      minute: 5,
    });
    this.createNewCron(
      DateTime.now(),
      firstHourEnd,
      BookingStatesEnum.RESERVED,
      booking.id,
      true
    );
  }
  private createBookingCronJobForPaying(booking: BookingEntity): void {
    const fiveMinutesToPay = DateTime.now().plus({ minute: 6 });
    this.createNewCron(
      DateTime.now(),
      fiveMinutesToPay,
      BookingStatesEnum.CANCELED,
      booking.id
    );
  }
  private findBookingsThatAreGoingToExpireIn3Days(shouldNotify: boolean) {
    return from(
      this.bookingRepository
        .createQueryBuilder("bookingEntity")
        .where(
          `DATE_PART('DAY', bookingEntity.dateEnd :: DATE) - DATE_PART('DAY', now() :: DATE) = 3`
        )
        .andWhere("bookingEntity.bookingType >= 1")
        .getMany()
    ).pipe(
      tap((b) => {
        if (shouldNotify) {
          const usersPhones = b.map((b) => b.user.phoneNumber);
          const usersEmails = b.map((b) => b.user.email);
          this.smsService.publishToArrayOfDestinations(
            usersPhones,
            BookingNotificationsEnum.RESERVATION_IS_GOING_TO_EXPIRE
          );
          this.emailService.publishEmailsToArrayOfDestinations(
            usersEmails,
            EmailTypesEnum.RESERVATION_IS_GOING_TO_EXPIRE
          );
        }
      })
    );
  }
  private findBookingsThatExpiresTodayAndUpdateTheirStatus(
    shouldNotify: boolean
  ) {
    return from(
      this.bookingRepository
        .createQueryBuilder("bookingEntity")
        .where(
          `DATE_PART('DAY', bookingEntity.dateEnd :: DATE) - DATE_PART('DAY', now() :: DATE) <= -1`
        )
        .andWhere("bookingEntity.bookingType >= 1")
        .getMany()
    ).pipe(
      tap((b) => {
        if (shouldNotify) {
          let phones: string[] = [];
          let emails: string[] = [];
          b.forEach((b) => {
            if (b.bookingState === BookingStatesEnum.RESERVED) {
              emails.push(b.user.email);
              phones.push(b.user.phoneNumber);
            }
          });
          this.smsService.publishToArrayOfDestinations(
            phones,
            BookingNotificationsEnum.RESERVATION_IS_ALREADY_EXPIRED
          );
          this.emailService.publishEmailsToArrayOfDestinations(
            emails,
            EmailTypesEnum.RESERVATION_EXPIRED
          );
        }
      }),
      tap((bookings) => {
        bookings.forEach((b) => {
          if (b.bookingState !== BookingStatesEnum.CANCELED)
            b.bookingState = BookingStatesEnum.FINALIZED;
        });
        this.bookingRepository.save(bookings).then();
      })
    );
  }
  findActiveBookingsByUserId(userId: string) {
    if (!uuid.validate(userId)) {
      throw new UUIDBadFormatException();
    }
    return this.getActiveBookingsByUserId(userId);
  }
  getActiveBookingsByUserId(userId: string) {
    return from(
      this.bookingRepository.find({
        where: {
          bookingState: In([
            BookingStatesEnum.RESERVED,
            BookingStatesEnum.IN_ADVANCE_RESERVED,
          ]),
          user: {
            id: userId,
          },
        },
        order: {
          bookingType: "ASC",
        },
      })
    );
  }
  resetCronJobsForBookingId(bookingId: string) {
    return this.findBookingById(bookingId).pipe(
      switchMap((b) => {
        return this.cronService.findCronByBookingIdAndExecuteFalse(b.id).pipe(
          switchMap((c) => {
            if (c) {
              c.executed = true;
              if (this.scheduler.doesExist("cron", bookingId)) {
                this.scheduler.deleteCronJob(bookingId);
              }
              return from(this.cronService.saveCron(c)).pipe(
                tap(() => {
                  this.createBookingCronJobForPaying(b);
                }),
                map(() => {
                  return true;
                })
              );
            }
            return of(false);
          })
        );
      })
    );
  }
  generatePaymentFromPayku(subId: string, paygate: string, priceToPay: number) {
    const paykuApi = "https://app.payku.cl";
    const transaction = "/api/sutransaction";
    const data = {
      suscription: subId,
      amount: priceToPay,
      order: DateTime.now().toFormat("ddMMyyhhmmss"),
      description: "desc",
      card: paygate,
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer tkpu25bfea3a4e6a2ea96257103f9d89",
      Sign: this.encryptForPayku(transaction, data),
    };
    console.log(headers);
    console.log(`${paykuApi}${transaction}`);
    return this.httpService.post(`${paykuApi}${transaction}`, data, {
      headers: headers,
    });
  }
  async generateAutomaticPayment(
    bookingId: string,
    priceToPay: number,
    subId: string,
    paygate: string,
    couponId: string,
    anticipatedBooking: boolean,
    bookingNextState?: BookingStatesEnum
  ) {
    return this.generatePaymentFromPayku(subId, paygate, priceToPay).pipe(
      switchMap((res) => {
        console.log(res);
        if (res.status === 200 && res.data.status === "success") {
          const updateBookingInput: UpdateBookingInput = {
            id: bookingId,
            bookingState: bookingNextState
              ? bookingNextState
              : BookingStatesEnum.RESERVED,
            anticipatedBooking: anticipatedBooking ?? undefined,
          };
          return this.updateBooking(updateBookingInput).pipe(
            switchMap((b) => {
              if (couponId && couponId !== "") {
                return from(this.couponService.findUserCoupon(couponId)).pipe(
                  switchMap((uc: UserCouponEntity) => {
                    const updateUserCouponInput: UpdateUserCouponInput = {
                      id: uc.id,
                      quantityRemaining: uc.quantityRemaining - 1,
                      valid: uc.quantityRemaining - 1 === 0 ? false : true,
                    };

                    return from(
                      this.couponService.updateUserCoupon(updateUserCouponInput)
                    ).pipe(tap((uc) => console.log(uc)));
                  }),
                  map((uc) => b)
                );
              }
              return of(b);
            })
          );
        }
        return of(null);
      })
    );
  }
  encryptForPayku(endpoint: string, body: any) {
    const path = encodeURIComponent(endpoint);
    const data = {
      ...body,
    };
    const orderedData: any = {};
    Object.keys(body)
      .sort()
      .forEach((key: string) => {
        orderedData[key] = data[key];
        if (typeof orderedData[key] === "object") {
          delete orderedData[key];
        }
      });
    const arrayConcat = new URLSearchParams(orderedData).toString();
    const concat = path + "&" + arrayConcat;
    const sign = this.crypto.HmacSHA256(concat);
    console.log(sign);
    return sign;
  }
  private getBookingsForParkingIdByDateRange(
    parkingId: string,
    dateStart: Date,
    dateEnd: Date
  ): Observable<BookingEntity[] | null> {
    return from(
      this.bookingRepository.find({
        where: {
          parking: {
            id: parkingId,
          },
          dateStart: Between(dateStart, dateEnd),
          dateEnd: Between(dateStart, dateEnd),
        },
      })
    );
  }
  private getBookingById(
    bookingId: string,
    relations?: any
  ): Observable<BookingEntity | null> {
    return from(
      this.bookingRepository.findOne({
        ...relations,
        where: {
          id: bookingId,
        },
      })
    );
  }
  async loadCronsFromRepository() {
    const jobs = await this.cronService.loadAllCronJobsFromCronRepository();
    jobs.forEach((j) => {
      if (
        DateTime.fromJSDate(j.dateEnd).toMillis() <= DateTime.now().toMillis()
      ) {
        this.executeStateChangeFromBooking(j);
        return;
      }
      if (
        DateTime.fromJSDate(j.dateStart).toMillis() <=
          DateTime.now().toMillis() &&
        DateTime.now().toMillis() <= DateTime.fromJSDate(j.dateEnd).toMillis()
      ) {
        this.createCronExisting(
          j,
          DateTime.now(),
          DateTime.fromJSDate(j.dateEnd),
          j.stateWhenEnd,
          j.bookingId
        );
        return;
      }
      if (
        DateTime.now().toMillis() < DateTime.fromJSDate(j.dateStart).toMillis()
      ) {
        this.createCronExisting(
          j,
          DateTime.fromJSDate(j.dateStart),
          DateTime.fromJSDate(j.dateEnd),
          j.stateWhenEnd,
          j.bookingId
        );
      }
    });
  }
  async createCronExisting(
    cron: CronEntity,
    dateStart: DateTime,
    dateEnd: DateTime,
    stateWhenEnd: BookingStatesEnum,
    bookingId: string,
    dateExtended?: boolean
  ): Promise<void> {
    const hasPreviousJob = this.scheduler.doesExist("cron", bookingId);
    if (hasPreviousJob) {
      this.scheduler.deleteCronJob(bookingId);
      await this.cronService.deleteCronByBookingId(bookingId);
    }
    const job = new CronJob(
      dateEnd.toJSDate(),
      () => {
        job.stop();
      },
      async () => {
        if (hasPreviousJob)
          this.executeStateChangeFromBooking(cron, dateExtended);
      },
      false,
      Settings.defaultZone.name
    );
    job.start();
    this.scheduler.addCronJob(bookingId, job);
  }
  async createNewCron(
    dateStart: DateTime,
    dateEnd: DateTime,
    stateWhenEnd: BookingStatesEnum,
    bookingId: string,
    dateExtended?: boolean
  ): Promise<void> {
    const hasPreviousJob = this.scheduler.doesExist("cron", bookingId);
    if (hasPreviousJob) {
      this.scheduler.deleteCronJob(bookingId);
      await this.cronService.deleteCronByBookingId(bookingId);
    }
    const cron = await this.cronService.createCron(
      dateStart,
      dateEnd,
      stateWhenEnd,
      bookingId
    );
    const job = new CronJob(
      dateEnd.toJSDate(),
      () => {
        job.stop();
      },
      async () => {
        if (hasPreviousJob)
          this.executeStateChangeFromBooking(cron, dateExtended);
      },
      false,
      Settings.defaultZone.name
    );
    job.start();
    this.scheduler.addCronJob(bookingId, job);
  }
  async executeStateChangeFromBooking(
    cron: CronEntity,
    dateExtended?: boolean
  ) {
    const updateBookingInput: UpdateBookingInput = {
      id: cron.bookingId,
      bookingState: cron.stateWhenEnd,
    };
    const book = await this.findBookingById(cron.bookingId).toPromise();
    if (dateExtended) {
      updateBookingInput.dateExtended = DateTime.now().toJSDate();
    } else if (
      cron.stateWhenEnd === BookingStatesEnum.RESERVED &&
      book &&
      book.bookingState === BookingStatesEnum.RESERVED
    ) {
      if (
        book &&
        book.dateEnd &&
        DateTime.fromJSDate(book.dateEnd).toMillis() <=
          DateTime.now().toMillis()
      ) {
        updateBookingInput.dateExtended = book.dateEnd;
      }
    }
    if (book && book.bookingState <= cron.stateWhenEnd)
      await this.updateBooking(updateBookingInput).toPromise().then();
    cron.executed = true;
    await this.cronService.saveCron(cron).then();
  }

  async getBookingCurrentPriceToPay(bookingId: string, userCouponid?: string) {
    const userCoupon = userCouponid
      ? await this.couponService.getUserCouponFromRepository(userCouponid)
      : undefined;
    const b = (await this.findBookingById(bookingId, { relations: { parking: true } }).toPromise())!;
    const p = b.parking
    if(b.dateExtended) {
      const now = DateTime.now();
      const isoExtendedDate = DateTime.fromJSDate(
        b.dateExtended
          ? b.dateExtended
          : b.dateStart
      );
      const diff = now.diff(isoExtendedDate, ["minutes"], {
        conversionAccuracy: "casual",
      });
      return this.calculateCurrentPriceWithParkingPrice(p, userCoupon, diff, b.user.wallet);
    }

    const duration = Duration.fromMillis(65*60000);
    return this.calculateCurrentPriceWithParkingPrice(p, userCoupon, duration, b.user.wallet);
  }
  calculateCurrentPriceWithParkingPrice(p: ParkingEntity, userCoupon: UserCouponEntity | undefined | null, diff: Duration, userWallet: number) {
    switch (p.type) {
      case ParkingType.PER_MINUTE: {
        if (userCoupon) {
          switch (userCoupon.coupon.type) {
            case CouponsTypeEnum.DISCOUNT_TO_TOTAL_PRICE: {
              const basePrice = +p.pricePerMinute * diff.minutes;
              const basePriceWith80Percent = Math.round((basePrice * 80) / 100);
              const userWalletDiscount = userWallet >= basePriceWith80Percent ? basePriceWith80Percent: userWallet;
              const discount = userCoupon.coupon.value;
              const finalPriceWithDiscounts = Math.round((basePrice - discount ) - userWalletDiscount)
              const tax = Math.round(finalPriceWithDiscounts * 0.19);

              const price: CurrentPriceBookingOutput = {
                amountToBePaid: Math.round(finalPriceWithDiscounts + tax),
                tax: tax,
                userWalletDiscount: userWalletDiscount,
                initialPrice: Math.round(basePrice),
                discount: discount,
              };
              return price;
            }
            case CouponsTypeEnum.DISCOUNT_TO_PRICE_PER_MINUTE: {
              const basePricePerMinute = Math.round(
                +p.pricePerMinute - userCoupon.coupon.value
              );
              const basePrice = Math.round(basePricePerMinute * diff.minutes)

              const basePriceWith80Percent = Math.round((basePrice * 80) / 100);
              const userWalletDiscount = userWallet >= basePriceWith80Percent ? basePriceWith80Percent: userWallet;
              const finalPriceWithDiscounts = Math.round(basePrice - userWalletDiscount)
              const tax = Math.round(finalPriceWithDiscounts * 0.19);
              const discount = userCoupon.coupon.value;

              const price: CurrentPriceBookingOutput = {
                amountToBePaid: Math.round(finalPriceWithDiscounts + tax),
                tax: tax,
                userWalletDiscount: userWalletDiscount,
                initialPrice: Math.round(basePrice),
                discount: discount,
              };
              return price;
            }
            case CouponsTypeEnum.DISCOUNT_PERCENTAGE_TO_TOTAL_PRICE: {
              const basePricePerMinute = Math.round(
                Math.round(+p.pricePerMinute * diff.minutes)
              );
              const baseCouponDiscount = Math.round((basePricePerMinute * userCoupon.coupon.value) / 100)
              const basePrice = Math.round(
                basePricePerMinute - baseCouponDiscount
              )
              const basePriceWith80Percent = Math.round((basePrice * 80) / 100);
              const userWalletDiscount = userWallet >= basePriceWith80Percent ? basePriceWith80Percent: userWallet;
              const finalPriceWithDiscounts = Math.round(basePrice - userWalletDiscount)
              const tax = Math.round(finalPriceWithDiscounts * 0.19);
              const discount = baseCouponDiscount

              const price: CurrentPriceBookingOutput = {
                amountToBePaid: Math.round((basePrice * 1.19 - discount) - userWalletDiscount),
                tax: tax,
                userWalletDiscount: userWalletDiscount,
                initialPrice: Math.round(basePrice),
                discount: discount,
              };
              return price;
            }
            case CouponsTypeEnum.DISCOUNT_PERCENTAGE_TO_PRICE_PER_MINUTE: {
              const basePercentageDiscountPerMinute = Math.round(
                (+p.pricePerMinute * userCoupon.coupon.value) / 100
              );
              const basePricePerMinute = Math.round(
                +p.pricePerMinute - basePercentageDiscountPerMinute
              );
              const basePrice = Math.round(basePricePerMinute * diff.minutes)
              const basePriceWith80Percent = Math.round((basePrice * 80) / 100);
              const userWalletDiscount = userWallet >= basePriceWith80Percent ? basePriceWith80Percent: userWallet;
              const finalPriceWithDiscounts = Math.round(basePrice - userWalletDiscount)
              const tax = Math.round(finalPriceWithDiscounts * 0.19);
              const price: CurrentPriceBookingOutput = {
                amountToBePaid: Math.round(finalPriceWithDiscounts + tax),
                tax: tax,
                userWalletDiscount: userWalletDiscount,
                initialPrice: basePrice,
                discount: basePercentageDiscountPerMinute
              };
              return price;
            }
            case CouponsTypeEnum.FREE_PRE_PAID_HOUR: {
              const price: CurrentPriceBookingOutput = {
                amountToBePaid: Math.round(
                  Math.round(+p.pricePerMinute * diff.minutes * 1.19)
                ),
                userWalletDiscount: 0,
                tax: Math.round(+p.pricePerMinute * diff.minutes * 0.19),
                initialPrice: Math.round(+p.pricePerMinute * diff.minutes),
                discount: Math.round(Math.round(+p.pricePerMinute * diff.minutes * 1.19)),
              };
              return price;
            }
          }
        }
        const basePrice = Math.round(+p.pricePerMinute * diff.minutes)
        const basePriceWith80Percent = Math.round((basePrice * 80) / 100);
        const userWalletDiscount = userWallet >= basePriceWith80Percent ? basePriceWith80Percent: userWallet;
        const finalPriceWithDiscounts = Math.round(basePrice - userWalletDiscount)
        const tax = Math.round(finalPriceWithDiscounts * 0.19);
        const price: CurrentPriceBookingOutput = {
          amountToBePaid: Math.round(finalPriceWithDiscounts + tax),
          tax: Math.round(+p.pricePerMinute * diff.minutes * 0.19),
          userWalletDiscount: userWalletDiscount,
          initialPrice: Math.round(+p.pricePerMinute * diff.minutes),
          discount: 0
        };
        return price;
      }
    }
    throw new Error();
  }
  getBookingsFromTheCurrentDayOfBuilding(buildingId: string) {
    return this.bookingRepository.find({
      relations: {
        parking: {
          building: true,
        },
        vehicle: true,
      },
      where: {
        parking: {
          building: Equal(buildingId),
        },
        bookingState: MoreThanOrEqual(BookingStatesEnum.PAYMENT_REQUIRED),
      },
      order: {
        dateStart: "DESC",
      },
    });
  }
}
