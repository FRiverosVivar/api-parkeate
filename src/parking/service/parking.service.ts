import { InjectRepository } from "@nestjs/typeorm";
import { ParkingEntity } from "../entity/parking.entity";
import { IsNull, Not, Repository } from "typeorm";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { forkJoin, from, map, Observable, of, switchMap, tap } from "rxjs";
import { CreateParkingInput } from "../model/create-parking.input";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../../utils/exceptions/UUIDBadFormat.exception";
import { UpdateParkingInput } from "../model/update-parking.input";
import { DuplicatedParkingInBuildingException } from "../../utils/exceptions/duplicated-parking-in-building.exception";
import { ClientService } from "../../client/service/client.service";
import { UserService } from "../../user/service/user.service";
import { BuildingService } from "../../building/service/building.service";
import { PhotoService } from "../../photo/service/photo.service";
import { CreatePhotoInput } from "../../photo/model/create-photo.input";
import { FileUpload } from "graphql-upload-minimal";
import {
  PageDto,
  PageOptionsDto,
  PaginationMeta,
} from "../../utils/interfaces/pagination.type";
import { ClientEntity } from "../../client/entity/client.entity";
import { UserTypesEnum } from "../../user/constants/constants";
import * as _ from "lodash";
import { DateTime } from "luxon";
import {
  MostProfitableParking,
  MostRentedParking,
  RawParkingMostRentedOfDay,
  TopMostRentedParkings,
} from "../model/finance-parking.output";
import { PrepaidHourParking } from "../model/prepaid-hour-parking.output";
import { ParkingType } from "../model/parking-type.enum";
import { CouponService } from "src/coupons/service/coupon.service";
import { CouponsTypeEnum } from "src/coupons/constants/coupons-type.enum";

@Injectable()
export class ParkingService {
  constructor(
    @InjectRepository(ParkingEntity)
    private readonly parkingRepository: Repository<ParkingEntity>,
    private readonly clientService: ClientService,
    private readonly userService: UserService,
    private readonly buildingService: BuildingService,
    private readonly photoService: PhotoService,
    private readonly couponService: CouponService
  ) {}
  createParking(
    createParkingInput: CreateParkingInput,
    buildingId: string,
    clientId: string
  ): Observable<ParkingEntity> {
    const parking = this.parkingRepository.create(createParkingInput);
    const building = this.buildingService.findBuildingById(buildingId);
    const owner = this.clientService.findClientById(clientId);
    return this.getParkingByBuildingPositionCode(
      parking.code,
      parking.floor,
      parking.section,
      buildingId
    ).pipe(
      switchMap((p) => {
        if (p) throw new DuplicatedParkingInBuildingException();

        return forkJoin([building, owner]).pipe(
          switchMap(([b, c]) => {
            parking.building = b;
            parking.client = c;
            parking.phone = b.phoneNumber;
            parking.blockedUsers = [];
            parking.schedule = [];

            return from(this.parkingRepository.save(parking));
          })
        );
      })
    );
  }
  removeParking(parkingId: string): Observable<ParkingEntity> {
    if (!uuid.validate(parkingId)) {
      throw new UUIDBadFormatException();
    }
    return this.findParkingById(parkingId).pipe(
      switchMap((p) => {
        return from(this.parkingRepository.remove([p])).pipe(map((p) => p[0]));
      })
    );
  }
  updateParking(
    updateParkingInput: UpdateParkingInput,
    buildingId?: string
  ): Observable<ParkingEntity> {
    return from(
      this.parkingRepository.preload({
        ...updateParkingInput,
      })
    ).pipe(
      switchMap((parking) => {
        if (!parking) {
          throw new NotFoundException();
        }

        if (buildingId) {
          const building$ = this.buildingService.findBuildingById(buildingId);

          return building$.pipe(
            tap((building) => {
              parking.building = building;
            }),
            switchMap(() => from(this.parkingRepository.save(parking)))
          );
        }

        return from(this.parkingRepository.save(parking));
      })
    );
  }
  findAllReservableParkingsByBuildingId(
    userId: string,
    buildingId: string
  ): Observable<ParkingEntity[]> {
    return from(
      this.parkingRepository.find({
        relations: {
          blockedUsers: true,
          building: true,
        },
        where: {
          building: {
            id: buildingId,
          },
          blockedUsers: [{ id: IsNull() }, { id: Not(userId) }],
          active: true,
          reserved: false,
          blocked: false,
        },
      })
    );
  }
  findParkingByBookingId(bookingId: string) {
    if (!uuid.validate(bookingId)) {
      throw new UUIDBadFormatException();
    }
    return this.getParkingByBookingId(bookingId).pipe(
      map((p) => {
        if (!p) throw new NotFoundException();

        return p;
      })
    );
  }
  findAllParkings(): Observable<ParkingEntity[]> {
    return from(this.parkingRepository.find());
  }
  findParkingByBuildingPositionCode(
    code: string,
    floor: number,
    section: string,
    buildingId: string
  ): Observable<ParkingEntity> {
    if (code === "") throw new BadRequestException();

    return this.getParkingByBuildingPositionCode(
      code,
      floor,
      section,
      buildingId
    ).pipe(
      map((p) => {
        if (!p) throw new NotFoundException();

        return p;
      })
    );
  }
  findParkingById(parkingId: string): Observable<ParkingEntity> {
    if (!uuid.validate(parkingId)) {
      throw new UUIDBadFormatException();
    }

    return this.getParkingById(parkingId).pipe(
      map((p) => {
        if (!p) throw new NotFoundException();
        return p;
      })
    );
  }
  findParkingByBuildingId(buildingId: string): Observable<ParkingEntity> {
    if (!uuid.validate(buildingId)) {
      throw new UUIDBadFormatException();
    }

    return this.getParkingByBuildingId(buildingId).pipe(
      map((p) => {
        if (!p) throw new NotFoundException();

        return p;
      })
    );
  }
  removeBlockedUserFromParking(userId: string, parkingId: string) {
    return this.userService.findUserById(userId).pipe(
      switchMap((u) => {
        return this.findParkingById(parkingId).pipe(
          switchMap((p) => {
            const blockedUsers = p.blockedUsers;
            _.remove(blockedUsers, (bu) => bu.id === userId);
            p.blockedUsers = blockedUsers;
            return from(this.parkingRepository.save(p));
          })
        );
      })
    );
  }
  addUserToParkingBlockList(userId: string, parkingId: string) {
    return this.userService.findUserById(userId).pipe(
      switchMap((u) => {
        return this.findParkingById(parkingId).pipe(
          switchMap((p) => {
            const blockedUsers = p.blockedUsers;
            blockedUsers.push(u);
            p.blockedUsers = blockedUsers;
            return from(this.parkingRepository.save(p));
          })
        );
      })
    );
  }
  async findPaginatedParkings(
    pagination: PageOptionsDto,
    buildingId: string,
    user: ClientEntity
  ) {
    const query = this.parkingRepository
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.client", "c")
      .leftJoinAndSelect("p.blockedUsers", "bu")
      .leftJoinAndSelect("p.building", "bl")
      .leftJoinAndSelect("p.schedule", "s")
      .leftJoinAndSelect("p.bookings", "b")
      .where(
        user.userType < UserTypesEnum.ADMIN ? `c.id = '${user.id}'::uuid` : ""
      )
      .andWhere(buildingId !== "" ? `bl.id = '${buildingId}'::uuid` : "")
      .orderBy("p.createdAt", "DESC")
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
  setParkingPhoto(
    parkingId: string,
    createPhotoInput: CreatePhotoInput,
    file: FileUpload | undefined
  ): Observable<ParkingEntity> {
    if (!file) throw new BadRequestException();

    return this.findParkingById(parkingId).pipe(
      switchMap((p) => {
        return this.photoService.createPhoto(createPhotoInput, file).pipe(
          tap((photo) => {
            if (p.photo) this.photoService.removePhoto(p.photo);
          }),
          switchMap((photo) => {
            p.photo = photo.url;
            return this.parkingRepository.save(p);
          })
        );
      })
    );
  }
  findMostProfitableParking() {
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
    const query = this.parkingRepository
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.bookings", "bookings")
      .select(`p.id, SUM(bookings."finalPrice") as "finalPrice"`)
      .where(
        `bookings."dateStart" BETWEEN '${todayStart.toISO()}' AND '${todayEnd.toISO()}'`
      )
      .andWhere(`bookings."bookingState" = 3`)
      .andWhere(`bookings.paid = TRUE`)
      .groupBy("p.id")
      .orderBy(`"finalPrice"`, "DESC")
      .limit(1);
    return from(query.getRawOne()).pipe(
      switchMap((p) => {
        if (!p) return of(null);
        return this.findParkingById(p.id).pipe(
          map((parking) => {
            const mostProfitableParking: MostProfitableParking = {
              parking: parking,
              totalPrice: p.finalPrice,
            };
            return mostProfitableParking;
          })
        );
      })
    );
  }
  async findWeekMostRentedParkings() {
    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const resultsByDayOfWeek: Record<
      string,
      RawParkingMostRentedOfDay | null | undefined
    > = {};
    const parkingsByDayOfWeek: Record<string, MostRentedParking | undefined> =
      {};
    let topRentedParkings: TopMostRentedParkings = {
      monday: undefined,
      tuesday: undefined,
      wednesday: undefined,
      thursday: undefined,
      friday: undefined,
      saturday: undefined,
      sunday: undefined,
    };
    for (const day of daysOfWeek) {
      const startOfDay = DateTime.now()
        .startOf("week")
        .plus({ days: daysOfWeek.indexOf(day) });
      const endOfDay = startOfDay.endOf("day");
      const query = this.parkingRepository
        .createQueryBuilder("p")
        .leftJoinAndSelect("p.bookings", "bookings")
        .select(
          `p.id as "parkingId", COUNT(bookings.id) as "quantityOfBookings"`
        )
        .where(
          `bookings."dateStart" BETWEEN '${startOfDay
            .startOf("day")
            .toISO()}' AND '${endOfDay.toISO()}'`
        )
        .groupBy("p.id")
        .orderBy(`"quantityOfBookings"`, "DESC")
        .limit(1);
      resultsByDayOfWeek[day] = await query.getRawOne();
      let parking: ParkingEntity | undefined;
      let mostRentedParking: MostRentedParking | undefined;
      if (resultsByDayOfWeek[day]) {
        parking = await this.findParkingById(
          resultsByDayOfWeek[day]!!.parkingId
        ).toPromise();
        if (parking) {
          mostRentedParking = {
            parking: parking,
            quantity: resultsByDayOfWeek[day]!!.quantityOfBookings,
          };
        }
      }
      parkingsByDayOfWeek[day] = mostRentedParking;
      const index = daysOfWeek.indexOf(day);
      const keys = Object.keys(topRentedParkings);
      topRentedParkings[keys[index] as keyof TopMostRentedParkings] =
        parkingsByDayOfWeek[day];
    }
    return topRentedParkings;
  }
  async calculateParkingFirstHour(parkingId: string, userCouponid?: string) {
    const userCoupon = userCouponid
      ? await this.couponService.findUserCoupon(userCouponid)
      : undefined;
    console.log(userCoupon);
    const p = (await this.findParkingById(parkingId).toPromise())!;
    switch (p.type) {
      case ParkingType.PER_MINUTE: {
        if (userCoupon) {
          switch (userCoupon.coupon.type) {
            case CouponsTypeEnum.DISCOUNT_TO_TOTAL_PRICE: {
              const price: PrepaidHourParking = {
                amountToBePaid: Math.round(
                  Math.round(+p.pricePerMinute * 65 * 1.19) -
                    userCoupon.coupon.value
                ),
                tax: Math.round(+p.pricePerMinute * 65 * 0.19),
                initialPrice: Math.round(+p.pricePerMinute * 65),
                discount: userCoupon.coupon.value,
              };
              return price;
            }
            case CouponsTypeEnum.DISCOUNT_TO_PRICE_PER_MINUTE: {
              const PPMwithDiscount = Math.round(
                +p.pricePerMinute - userCoupon.coupon.value
              );
              const amountToBePaidWithPPM = Math.round(
                Math.round(PPMwithDiscount * 65 * 1.19)
              );

              const price: PrepaidHourParking = {
                amountToBePaid: amountToBePaidWithPPM,
                tax: Math.round(PPMwithDiscount * 65 * 0.19),
                initialPrice: Math.round(+p.pricePerMinute * 65),
                discount: Math.round(userCoupon.coupon.value * 65),
              };
              return price;
            }
            case CouponsTypeEnum.DISCOUNT_PERCENTAGE_TO_TOTAL_PRICE: {
              const amountToBePaid = Math.round(
                Math.round(+p.pricePerMinute * 65 * 1.19)
              );
              const price: PrepaidHourParking = {
                amountToBePaid: Math.round(
                  amountToBePaid -
                    Math.round((amountToBePaid * userCoupon.coupon.value) / 100)
                ),
                tax: Math.round(+p.pricePerMinute * 65 * 0.19),
                initialPrice: Math.round(+p.pricePerMinute * 65),
                discount: Math.round(
                  (amountToBePaid * userCoupon.coupon.value) / 100
                ),
              };
              return price;
            }
            case CouponsTypeEnum.DISCOUNT_PERCENTAGE_TO_PRICE_PER_MINUTE: {
              const percentageToDiscount = Math.round(
                (+p.pricePerMinute * userCoupon.coupon.value) / 100
              );
              const finalPPM = Math.round(
                +p.pricePerMinute - percentageToDiscount
              );
              const amountToBePaid = Math.round(
                Math.round(finalPPM * 65 * 1.19)
              );
              const price: PrepaidHourParking = {
                amountToBePaid: amountToBePaid,
                tax: Math.round(finalPPM * 65 * 0.19),
                initialPrice: Math.round(+p.pricePerMinute * 65),
                discount: Math.round(
                  Math.round(+p.pricePerMinute * 65) - Math.round(finalPPM * 65)
                ),
              };
              return price;
            }
            case CouponsTypeEnum.FREE_PRE_PAID_HOUR: {
              const price: PrepaidHourParking = {
                amountToBePaid: Math.round(
                  Math.round(+p.pricePerMinute * 65 * 1.19)
                ),
                tax: Math.round(+p.pricePerMinute * 65 * 0.19),
                initialPrice: Math.round(+p.pricePerMinute * 65),
                discount: Math.round(Math.round(+p.pricePerMinute * 65 * 1.19)),
              };
              return price;
            }
          }
        }
        const price: PrepaidHourParking = {
          amountToBePaid: 50,
          tax: 1,
          initialPrice: Math.round(+p.pricePerMinute * 65),
        };
        return price;
      }
      case ParkingType.MONTHLY: {
        if (userCoupon) {
          switch (userCoupon.coupon.type) {
            case CouponsTypeEnum.DISCOUNT_TO_TOTAL_PRICE: {
              const PPM = Math.round(+p.priceMonthly - userCoupon.coupon.value);
              const price: PrepaidHourParking = {
                amountToBePaid: Math.round(Math.round(PPM * 1.19)),
                tax: Math.round(PPM * 0.19),
                initialPrice: Math.round(+p.priceMonthly),
                discount: userCoupon.coupon.value,
              };
              return price;
            }
            case CouponsTypeEnum.DISCOUNT_TO_PRICE_PER_MINUTE: {
              const PPM = Math.round(+p.priceMonthly - userCoupon.coupon.value);
              const price: PrepaidHourParking = {
                amountToBePaid: Math.round(Math.round(PPM * 1.19)),
                tax: Math.round(PPM * 0.19),
                initialPrice: Math.round(+p.priceMonthly),
                discount: userCoupon.coupon.value,
              };
              return price;
            }
            case CouponsTypeEnum.DISCOUNT_PERCENTAGE_TO_TOTAL_PRICE: {
              const amountToBePaid = Math.round(
                Math.round(+p.priceMonthly * 1.19)
              );
              const discount = Math.round(
                (Math.round(+p.priceMonthly) * userCoupon.coupon.value) / 100
              );
              const price: PrepaidHourParking = {
                amountToBePaid: Math.round(amountToBePaid - discount),
                tax: Math.round(Math.round(amountToBePaid - discount) * 0.19),
                initialPrice: Math.round(+p.priceMonthly),
                discount: discount,
              };
              return price;
            }
            case CouponsTypeEnum.DISCOUNT_PERCENTAGE_TO_PRICE_PER_MINUTE: {
              const amountToBePaid = Math.round(
                Math.round(+p.priceMonthly * 1.19)
              );
              const discount = Math.round(
                (Math.round(+p.priceMonthly) * userCoupon.coupon.value) / 100
              );
              const price: PrepaidHourParking = {
                amountToBePaid: Math.round(amountToBePaid - discount),
                tax: Math.round(Math.round(amountToBePaid - discount) * 0.19),
                initialPrice: Math.round(+p.priceMonthly),
                discount: discount,
              };
              return price;
            }
            case CouponsTypeEnum.FREE_PRE_PAID_HOUR: {
              const price: PrepaidHourParking = {
                amountToBePaid: Math.round(+p.priceMonthly * 1.19),
                tax: Math.round(+p.priceMonthly * 0.19),
                initialPrice: +p.priceMonthly,
                discount: Math.round(+p.priceMonthly * 1.19),
              };
              return price;
            }
          }
        }
        const price: PrepaidHourParking = {
          amountToBePaid: Math.round(+p.priceMonthly * 1.19),
          tax: Math.round(+p.priceMonthly * 0.19),
          initialPrice: +p.priceMonthly,
        };
        return price;
      }
      case ParkingType.YEARLY: {
        break;
      }
    }
  }
  private getParkingByBuildingPositionCode(
    code: string,
    floor: number,
    section: string,
    buildingId: string
  ): Observable<ParkingEntity | null> {
    return from(
      this.parkingRepository.findOne({
        where: {
          building: {
            id: buildingId,
          },
          floor: floor,
          code: code,
          section: section,
        },
      })
    );
  }
  private getParkingById(id: string): Observable<ParkingEntity | null> {
    return from(
      this.parkingRepository.findOne({
        relations: {
          blockedUsers: true,
          building: true,
        },
        where: {
          id: id,
        },
      })
    );
  }
  private getParkingByBookingId(
    bookingId: string
  ): Observable<ParkingEntity | null> {
    return from(
      this.parkingRepository.findOne({
        where: {
          bookings: {
            id: bookingId,
          },
        },
      })
    );
  }
  private getParkingByBuildingId(
    buildingId: string
  ): Observable<ParkingEntity | null> {
    return from(
      this.parkingRepository.findOne({
        where: {
          building: {
            id: buildingId,
          },
        },
      })
    );
  }
}
