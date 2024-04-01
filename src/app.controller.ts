import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  Query,
  UseGuards,
} from "@nestjs/common";
import { BookingService } from "./booking/service/booking.service";
import { BookingEntity } from "./booking/entity/booking.entity";
import { Observable, from, map, of, switchMap, tap } from "rxjs";
import { UpdateBookingInput } from "./booking/model/update-booking.input";
import { BookingStatesEnum } from "./booking/enum/booking-states.enum";
import { BuildingService } from "./building/service/building.service";
import { CouponService } from "./coupons/service/coupon.service";
import { UpdateUserCouponInput } from "./coupons/model/update-user-coupon.input";
import { UserCouponEntity } from "./coupons/user-coupons/entity/user-coupons.entity";
import { UserService } from "./user/service/user.service";
import { UserEntity } from "./user/entity/user.entity";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { UserTypeGuard } from "./auth/guards/user-type.guard";
import { UserType } from "./auth/decorator/user-type.decorator";
import { UserTypesEnum } from "./user/constants/constants";
import { ClientService } from "./client/service/client.service";
import type { Response } from "express";
@Controller("/booking/confirmPayment")
export class AppController {
  constructor(
    private readonly bookingService: BookingService,
    private buildingService: BuildingService,
    private clientService: ClientService,
    private couponService: CouponService,
    private readonly userService: UserService
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
    return this.bookingService.updateBooking(updateBookingInput).pipe(
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
    return this.bookingService.updateBooking(updateBookingInput).pipe(
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
  @Post("/new-client")
  createPaykuClient(@Body() body: any): Observable<any> {
    return this.userService
      .findUserById(body.userId)
      .pipe(
        switchMap((u: UserEntity) =>
          this.userService.createPaykuProfileWithUserData(u)
        )
      );
  }
  @Post("/new-transaction")
  createPaykuTransactionAutomatic(@Body() body: any): Observable<any> {
    return this.userService.createAutomaticTransaction(body);
  }
  @Post("/get-sign")
  getSign(@Body() body: any) {
    return this.userService.encryptForPayku("/api/suplan", body);
  }
  @Get("/exportClients")
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async getExportedClients(@Res() res: Response) {
    const buffer = await this.clientService.exportClients();
    return res
      .set("Content-Disposition", `attachment; filename=example.xlsx`)
      .send(buffer);
  }
  @Get("/exportUsers")
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async getExportedUsers(@Res() res: Response) {
    const buffer = await this.userService.exportUsers();
    return res
      .set("Content-Disposition", `attachment; filename=example.xlsx`)
      .send(buffer);
  }
}
