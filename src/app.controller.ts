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
import { DateTime } from "luxon";
import { ParkingService } from "./parking/service/parking.service";
import { UpdateUserInput } from "./user/model/dto/update-user.input";
@Controller("/booking/confirmPayment")
export class AppController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly clientService: ClientService,
    private readonly couponService: CouponService,
    private readonly userService: UserService,
    private readonly parkingService: ParkingService
  ) {}

  @Get("")
  updateBookingToReservedStatus(
    @Query("bookingId") bookingId: string,
    @Query("userCouponId") couponId: string,
    @Query("anticipatedBooking") anticipatedBooking: string
  ): Observable<any> {
    const isAnticipatedBooking = anticipatedBooking ? true : false;
    const updateBookingInput: UpdateBookingInput = {
      id: bookingId,
      bookingState: isAnticipatedBooking
        ? BookingStatesEnum.IN_ADVANCE_RESERVED
        : BookingStatesEnum.RESERVED,
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
    @Query("userCouponId") couponId: string,
    @Query("anticipatedBooking") anticipatedBooking: string
  ): Observable<any> {
    const isAnticipatedBooking = anticipatedBooking ? true : false;
    const updateBookingInput: UpdateBookingInput = {
      id: bookingId,
      bookingState: isAnticipatedBooking
        ? BookingStatesEnum.IN_ADVANCE_RESERVED
        : BookingStatesEnum.RESERVED,
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
    @Query("finalPrice") finalPrice: number,
    @Query("couponId") couponId: string,
    @Query("amountUserWallet") amountUserWallet: string,
  ): Observable<BookingEntity> {
    const updateBookingInput: UpdateBookingInput = {
      id: bookingId,
      paid: true,
      finalPrice: finalPrice,
      bookingState: BookingStatesEnum.FINALIZED,
    };
    return this.bookingService.updateBooking(updateBookingInput).pipe(
      switchMap((b) => {
        if(amountUserWallet && amountUserWallet !== "" && +amountUserWallet > 0) {
          const updateUserInput: UpdateUserInput = {
            id: b.user.id,
            wallet: Math.round(b.user.wallet - +amountUserWallet)
          }
          return from(this.userService.updateUser(updateUserInput).pipe(
            switchMap(() => of(b))
          ));
        }
        return of(b);
      }),
      switchMap((b) => {
        if(!couponId || couponId === "") return of(b);
        return from(this.couponService.findUserCoupon(couponId)).pipe(
          switchMap((uc: UserCouponEntity) => {
            const updateUserCouponInput: UpdateUserCouponInput = {
              id: uc.id,
              quantityRemaining: uc.quantityRemaining - 1,
              valid: uc.quantityRemaining - 1 !== 0,
            };

            return from(
              this.couponService.updateUserCoupon(updateUserCouponInput)
            ).pipe((switchMap(() => of(b))))
          })
        );
      })
    )
  }
  @Post("/extended")
  paymentExtraTime(
    @Query("bookingId") bookingId: string,
    @Query("finalPrice") finalPrice: number,
    @Query("couponId") couponId: string,
    @Query("amountUserWallet") amountUserWallet: string,
  ): Observable<BookingEntity> {
    const updateBookingInput: UpdateBookingInput = {
      id: bookingId,
      paid: true,
      finalPrice: finalPrice,
      bookingState: BookingStatesEnum.FINALIZED,
    };
    return this.bookingService.updateBooking(updateBookingInput).pipe(
      switchMap((b) => {
        if(amountUserWallet && amountUserWallet !== "" && +amountUserWallet > 0) {
          const updateUserInput: UpdateUserInput = {
            id: b.user.id,
            wallet: Math.round(b.user.wallet - +amountUserWallet)
          }
          return from(this.userService.updateUser(updateUserInput).pipe(
            switchMap(() => of(b))
          ));
        }
        return of(b);
      }),
      switchMap((b) => {
        if(!couponId || couponId === "") return of(b);
        return from(this.couponService.findUserCoupon(couponId)).pipe(
          switchMap((uc: UserCouponEntity) => {
            const updateUserCouponInput: UpdateUserCouponInput = {
              id: uc.id,
              quantityRemaining: uc.quantityRemaining - 1,
              valid: uc.quantityRemaining - 1 !== 0,
            };

            return from(
              this.couponService.updateUserCoupon(updateUserCouponInput)
            ).pipe((switchMap(() => of(b))))
          })
        );
      })
    )
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
  @Post("/exportParkings")
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async exportParkings(@Res() res: Response, @Body() parkings: string[]) {
    const buffer = await this.parkingService.exportParkings(parkings);
    return res
      .set("Content-Disposition", `attachment; filename=exportedParkings-{${DateTime.now().toISO()}}.xlsx`)
      .send(buffer);
  }
}
