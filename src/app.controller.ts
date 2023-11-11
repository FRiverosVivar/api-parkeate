import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { BookingService } from "./booking/service/booking.service";
import { BookingEntity } from "./booking/entity/booking.entity";
import { Observable, from, of, switchMap, tap } from "rxjs";
import { UpdateBookingInput } from "./booking/model/update-booking.input";
import { BookingStatesEnum } from "./booking/enum/booking-states.enum";
import { ParkingService } from "./parking/service/parking.service";
import { BuildingService } from "./building/service/building.service";
import { TagsService } from "./tags/service/tags.service";
import { CouponService } from "./coupons/service/coupon.service";
import { UpdateUserCouponInput } from "./coupons/model/update-user-coupon.input";
import { UserCode } from "aws-sdk/clients/alexaforbusiness";
import { UserCouponEntity } from "./coupons/user-coupons/entity/user-coupons.entity";

@Controller("/booking/confirmPayment")
export class AppController {
  constructor(
    private readonly bookingService: BookingService,
    private buildingService: BuildingService,
    private parkingService: ParkingService,
    private couponService: CouponService
  ) {}

  @Get("")
  updateBookingToReservedStatus(
    @Query("bookingId") bookingId: string,
    @Query("userCouponId") couponId: string
  ): Observable<any> {
    const updateBookingInput: UpdateBookingInput = {
      id: bookingId,
      bookingState: BookingStatesEnum.RESERVED,
    };
    console.log(couponId);
    return this.bookingService.updateBooking(updateBookingInput).pipe(
      switchMap((b) => {
        console.log("couponId");
        if (couponId && couponId !== "") {
          console.log("couponId");
          return from(this.couponService.findUserCoupon(couponId)).pipe(
            switchMap((uc: UserCouponEntity) => {
              const updateUserCouponInput: UpdateUserCouponInput = {
                id: uc.id,
                quantityRemaining: uc.quantityRemaining - 1,
                valid: uc.quantityRemaining - 1 === 0 ? false : true,
              };

              console.log(uc);
              return from(
                this.couponService.updateUserCoupon(updateUserCouponInput)
              ).pipe(tap((uc) => console.log(uc)));
            })
          );
        }
        return of(b);
      })
    );
  }
  @Post("")
  updateBookingReservedStatus(
    @Query("bookingId") bookingId: string,
    @Query("userCouponId") couponId: string
  ): Observable<any> {
    const updateBookingInput: UpdateBookingInput = {
      id: bookingId,
      bookingState: BookingStatesEnum.RESERVED,
    };
    console.log(couponId);
    return this.bookingService.updateBooking(updateBookingInput).pipe(
      switchMap((b) => {
        console.log("couponId");
        if (couponId && couponId !== "") {
          console.log("couponId");
          return from(this.couponService.findUserCoupon(couponId)).pipe(
            switchMap((uc: UserCouponEntity) => {
              const updateUserCouponInput: UpdateUserCouponInput = {
                id: uc.id,
                quantityRemaining: uc.quantityRemaining - 1,
                valid: uc.quantityRemaining - 1 === 0 ? false : true,
              };

              console.log(uc);
              return from(
                this.couponService.updateUserCoupon(updateUserCouponInput)
              ).pipe(tap((uc) => console.log(uc)));
            })
          );
        }
        return of(b);
      })
    );
  }
  @Get("/extended")
  successPaymentExtraTime(
    @Query("bookingId") bookingId: string,
    @Query("mountPaid") mountPaid: number
  ): Observable<BookingEntity> {
    const updateBookingInput: UpdateBookingInput = {
      id: bookingId,
      paid: true,
      mountPaid: mountPaid,
      bookingState: BookingStatesEnum.FINALIZED,
    };
    return this.bookingService.updateBooking(updateBookingInput);
  }
  @Post("/extended")
  paymentExtraTime(
    @Query("bookingId") bookingId: string,
    @Query("mountPaid") mountPaid: number
  ): Observable<BookingEntity> {
    const updateBookingInput: UpdateBookingInput = {
      id: bookingId,
      paid: true,
      mountPaid: mountPaid,
      bookingState: BookingStatesEnum.FINALIZED,
    };
    return this.bookingService.updateBooking(updateBookingInput);
  }
}
