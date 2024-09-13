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
import { RequestService } from "./requests/service/request.service";
import { TransbankService } from "./utils/transbank/transbank.service";
@Controller("")
export class AppController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly clientService: ClientService,
    private readonly couponService: CouponService,
    private readonly userService: UserService,
    private readonly parkingService: ParkingService,
    private readonly requestService: RequestService,
    private readonly tbkService: TransbankService
  ) {}

  @Get("/booking/confirmPayment")
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
  @Post("/booking/confirmPayment")
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
  @Get("/booking/confirmPayment/extended")
  successPaymentExtraTime(
    @Query("bookingId") bookingId: string,
    @Query("finalPrice") finalPrice: number,
    @Query("userCouponId") couponId: string,
    @Query("amountUserWallet") amountUserWallet: string
  ): Observable<BookingEntity> {
    const updateBookingInput: UpdateBookingInput = {
      id: bookingId,
      paid: true,
      finalPrice: finalPrice,
      bookingState: BookingStatesEnum.FINALIZED,
    };
    return this.bookingService.updateBooking(updateBookingInput).pipe(
      switchMap((b) => {
        if (
          amountUserWallet &&
          amountUserWallet !== "" &&
          +amountUserWallet > 0
        ) {
          const updateUserInput: UpdateUserInput = {
            id: b.user.id,
            wallet: Math.round(b.user.wallet - +amountUserWallet),
          };
          return from(
            this.userService
              .updateUser(updateUserInput)
              .pipe(switchMap(() => of(b)))
          );
        }
        return of(b);
      }),
      switchMap((b) => {
        if (!couponId || couponId === "") return of(b);
        return from(this.couponService.findUserCoupon(couponId)).pipe(
          switchMap((uc: UserCouponEntity) => {
            const updateUserCouponInput: UpdateUserCouponInput = {
              id: uc.id,
              quantityRemaining: uc.quantityRemaining - 1,
              valid: uc.quantityRemaining - 1 !== 0,
            };

            return from(
              this.couponService.updateUserCoupon(updateUserCouponInput)
            ).pipe(switchMap(() => of(b)));
          })
        );
      })
    );
  }
  @Post("/booking/confirmPayment/extended")
  paymentExtraTime(
    @Query("bookingId") bookingId: string,
    @Query("finalPrice") finalPrice: number,
    @Query("userCouponId") couponId: string,
    @Query("amountUserWallet") amountUserWallet: string
  ): Observable<BookingEntity> {
    const updateBookingInput: UpdateBookingInput = {
      id: bookingId,
      paid: true,
      finalPrice: finalPrice,
      bookingState: BookingStatesEnum.FINALIZED,
    };
    return this.bookingService.updateBooking(updateBookingInput).pipe(
      switchMap((b) => {
        if (
          amountUserWallet &&
          amountUserWallet !== "" &&
          +amountUserWallet > 0
        ) {
          const updateUserInput: UpdateUserInput = {
            id: b.user.id,
            wallet: Math.round(b.user.wallet - +amountUserWallet),
          };
          return from(
            this.userService
              .updateUser(updateUserInput)
              .pipe(switchMap(() => of(b)))
          );
        }
        return of(b);
      }),
      switchMap((b) => {
        if (!couponId || couponId === "") return of(b);
        return from(this.couponService.findUserCoupon(couponId)).pipe(
          switchMap((uc: UserCouponEntity) => {
            const updateUserCouponInput: UpdateUserCouponInput = {
              id: uc.id,
              quantityRemaining: uc.quantityRemaining - 1,
              valid: uc.quantityRemaining - 1 !== 0,
            };

            return from(
              this.couponService.updateUserCoupon(updateUserCouponInput)
            ).pipe(switchMap(() => of(b)));
          })
        );
      })
    );
  }
  @Post("/booking/confirmPayment/new-client")
  createPaykuClient(@Body() body: any): Observable<any> {
    return this.userService
      .findUserById(body.userId)
      .pipe(
        switchMap((u: UserEntity) =>
          this.userService.createPaykuProfileWithUserData(u)
        )
      );
  }
  @Post("/booking/confirmPayment/new-transaction")
  createPaykuTransactionAutomatic(@Body() body: any): Observable<any> {
    return this.userService.createAutomaticTransaction(body);
  }
  @Post("/booking/confirmPayment/get-sign")
  getSign(@Body() body: any) {
    return this.userService.encryptForPayku("/api/suplan", body);
  }
  @Get("/booking/confirmPayment/exportClients")
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async getExportedClients(@Res() res: Response) {
    const buffer = await this.clientService.exportClients();
    return res
      .set("Content-Disposition", `attachment; filename=example.xlsx`)
      .send(buffer);
  }
  @Get("/booking/confirmPayment/exportUsers")
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async getExportedUsers(@Res() res: Response) {
    const buffer = await this.userService.exportUsers();
    return res
      .set("Content-Disposition", `attachment; filename=example.xlsx`)
      .send(buffer);
  }
  @Post("/booking/confirmPayment/exportParkings")
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async exportParkings(@Res() res: Response, @Body() parkings: string[]) {
    const buffer = await this.parkingService.exportParkings(parkings);
    return res
      .set(
        "Content-Disposition",
        `attachment; filename=exportedParkings-{${DateTime.now().toISO()}}.xlsx`
      )
      .send(buffer);
  }
  @Post("/booking/confirmPayment/exportRequests")
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async exportRequests(@Res() res: Response, @Body() requests: string[]) {
    const buffer = await this.requestService.exportRequests(requests);
    return res
      .set(
        "Content-Disposition",
        `attachment; filename=exportedRequests-{${DateTime.now().toISO()}}.xlsx`
      )
      .send(buffer);
  }
  @Post("/booking/confirmPayment/updateRequest")
  async updateRequest(
    @Query("id") id: string,
    @Query("status") status: number
  ) {
    const updateRequest = {
      id,
      status: +status,
    };
    return this.requestService.updateRequest(updateRequest);
  }
  @Post("/tbk")
  async generateTransaction(
    @Query("amount") amount: string,
    @Query("callbackUrl") callbackUrl: string
  ) {
    return this.tbkService.generateTransaction(Number(amount), callbackUrl);
  }
  @Get("/tbk")
  async confirmTransaction(@Query("token") token: string) {
    return this.tbkService.confirmTransaction(token);
  }
  @Get("/tbk/status")
  async transactionStatus(@Query("token") token: string) {
    return this.tbkService.transactionStatus(token);
  }
  @Post("/tbk/createInscriptionOneClick")
  async createInscriptionOneClick(
    @Query("userName") userName: string,
    @Query("email") email: string,
    @Query("callBackUrl") callBackUrl: string
  ) {
    return this.tbkService.createInscriptionOneClick(
      userName,
      email,
      callBackUrl
    );
  }
  @Post("/tbk/confirmInscriptionOneClick")
  async confirmInscriptionOneClick(
    @Query("token") token: string,
    @Query("userId") userId: string
  ) {
    return this.tbkService.confirmInscriptionOneClick(token, userId);
  }
  @Post("/tbk/deleteInscriptionOneClick")
  async deleteInscriptionOneClick(
    @Query("token") token: string,
    @Query("username") username: string,
    @Query("userId") userId: string
  ) {
    return this.tbkService.deleteInscriptionOneClick(token, username, userId);
  }
  //   @Post("/tbk/validateInscriptionOneClick")
  //   async validateInscriptionOneClick(
  //     @Query("token") token: string) {
  //       return this.tbkService.validateInscriptionOneClick(token)
  //     }
}
