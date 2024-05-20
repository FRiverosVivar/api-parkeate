import { BookingEntity } from "../entity/booking.entity";
import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { BookingService } from "../service/booking.service";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CreateBookingInput } from "../model/create-booking.input";
import { UpdateBookingInput } from "../model/update-booking.input";
import { UserTypeGuard } from "../../auth/guards/user-type.guard";
import { UserTypesEnum } from "../../user/constants/constants";
import { UserType } from "../../auth/decorator/user-type.decorator";
import { from, Observable } from "rxjs";
import { CurrentUser } from "../../auth/decorator/current-user.decorator";
import { UserEntity } from "../../user/entity/user.entity";
import {
  BookingsPaginated,
  PageOptionsDto,
} from "../../utils/interfaces/pagination.type";
import { ClientEntity } from "../../client/entity/client.entity";
import {
  BookingDailyFinance,
  BookingDailyIncomeFinance,
} from "../model/finance-booking.output";
import { WeeklyBuildingProfit } from "../../building/model/finance-building.output";
import { PaykuModel, PaykuResponse } from "../model/payku-model.input";
import { BookingPriceCalculated } from "../model/booking-calculate-price.output";
import { BookingStatesEnum } from "../enum/booking-states.enum";
import { type } from "os";
import { CurrentPriceBookingOutput } from "../model/current-price-booking.output";

@Resolver(BookingEntity)
export class BookingResolver {
  constructor(private readonly bookingService: BookingService) {}

  @Mutation(() => BookingEntity)
  @UseGuards(JwtAuthGuard)
  createBooking(
    @Args("createBookingInput") createBookingInput: CreateBookingInput,
    @Args("parkingId") parkingId: string,
    @CurrentUser() user: UserEntity,
    @Args("vehicleId", { nullable: true }) vehicleId: string,
    @Args("selectedDate", { nullable: true }) selectedDate: string
  ) {
    return this.bookingService.createBooking(
      createBookingInput,
      parkingId,
      user.id,
      vehicleId,
      selectedDate
    );
  }
  @Mutation(() => BookingEntity)
  updateBooking(
    @Args("updateBookingInput") updateBookingInput: UpdateBookingInput
  ) {
    return this.bookingService.updateBooking(updateBookingInput);
  }
  @Mutation(() => BookingEntity)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(UserTypeGuard)
  removeBooking(@Args("bookingId") bookingId: string) {
    return this.bookingService.removeBooking(bookingId);
  }
  @Query(() => PaykuResponse)
  getBookingCountForOrderNumberAndCreatePaykuOrder(
    @Args("paykuModel") paykuModel: PaykuModel
  ) {
    return this.bookingService.getBookingCountForOrderNumberAndCreatePaykuOrder(
      paykuModel
    );
  }
  @Query(() => BookingsPaginated, { name: "getPaginatedBookings" })
  @UseGuards(JwtAuthGuard)
  getPaginatedBookings(
    @Args("paginationOptions") paginationOptions: PageOptionsDto,
    @Args("parkingId", { nullable: true }) parkingId: string,
    @Args("displayAll", { nullable: true }) displayAll: boolean,
    @CurrentUser() user: UserEntity
  ) {
    return this.bookingService.findPaginatedBookings(
      paginationOptions,
      displayAll,
      parkingId,
      user as any as ClientEntity
    );
  }
  @Query(() => BookingDailyFinance, {
    name: "findBookingsMadeTodayAndYesterday",
  })
  @UseGuards(JwtAuthGuard)
  findBookingsMadeTodayAndYesterday() {
    return this.bookingService.findBookingsMadeTodayAndYesterday();
  }
  @Query(() => BookingDailyIncomeFinance, {
    name: "findBookingsAndGetDailyIncomeAndPercentage",
  })
  @UseGuards(JwtAuthGuard)
  findBookingsAndGetDailyIncomeAndPercentage() {
    return this.bookingService.findBookingsAndGetDailyIncomeAndPercentage();
  }
  @Query(() => BookingEntity)
  findBookingById(
    @Args("bookingId") bookingId: string,
    @Args("relations", { nullable: true }) relations: string
  ) {
    return this.bookingService.findBookingById(
      bookingId,
      relations ? JSON.parse(relations) : undefined
    );
  }
  @Query(() => BookingEntity)
  updateBookingParking(
    @Args("bookingId") bookingId: string,
    @Args("parkingId") parkingId: string
  ) {
    return this.bookingService.changeBookingParking(bookingId, parkingId);
  }
  @Query(() => BookingEntity)
  updateBookingUser(
    @Args("bookingId") bookingId: string,
    @Args("userId") userId: string
  ) {
    return this.bookingService.changeBookingUser(bookingId, userId);
  }
  @Query(() => [BookingEntity])
  @UseGuards(JwtAuthGuard)
  getActiveBookingByUserId(@CurrentUser() user: UserEntity) {
    return this.bookingService.findActiveBookingsByUserId(user.id);
  }
  @Query(() => [BookingEntity])
  @UseGuards(JwtAuthGuard)
  getUnPaidBookings(@CurrentUser() user: UserEntity) {
    return this.bookingService.findUnPaidBookings(user.id);
  }
  @Query(() => BookingEntity)
  @UseGuards(JwtAuthGuard)
  getBookingWithPaymentRequiredToStart(@CurrentUser() user: UserEntity) {
    return this.bookingService.findBookingWithPaymentRequiredToStart(user.id);
  }
  @Query(() => BookingPriceCalculated)
  @UseGuards(JwtAuthGuard)
  getBookingPriceCalculated(@Args("bookingId") bookingId: string) {
    return this.bookingService.getBookingPriceCalculated(bookingId);
  }
  @Query(() => BookingEntity)
  @UseGuards(JwtAuthGuard)
  resetCronJobsForBookingId(@Args("bookingId") bookingId: string) {
    return this.bookingService.resetCronJobsForBookingId(bookingId);
  }

  @Query(() => [BookingEntity], { name: "findRecentBookingsFromBuildings" })
  @UseGuards(JwtAuthGuard)
  findRecentBookingsFromBuildings(@CurrentUser() client: ClientEntity) {
    return this.bookingService.findRecentBookingsFromBuildings(client);
  }
  @Query(() => CurrentPriceBookingOutput, { name: "getBookingCurrentPriceToPay" })
  @UseGuards(JwtAuthGuard)
  getBookingCurrentPriceToPay(
    @Args("bookingId") bookingId: string,
    @Args("userCouponId", { nullable: true }) userCouponId: string
  ) {
    return this.bookingService.getBookingCurrentPriceToPay(bookingId, userCouponId);
  }
  @Mutation(() => BookingEntity)
  @UseGuards(JwtAuthGuard)
  generatePaymentFromPayku(
    @Args("bookingId") bookingId: string,
    @Args("paygate") paygate: string,
    @Args("subId") subId: string,
    @Args("priceToPay") priceToPay: number,
    @Args("couponId", { nullable: true }) couponId: string,
    @Args("anticipatedBooking", { nullable: true }) anticipatedBooking: boolean,
    @Args("bookingNextState", { nullable: true })
    bookingNextState?: BookingStatesEnum
  ) {
    return this.bookingService.generateAutomaticPayment(
      bookingId,
      priceToPay,
      subId,
      paygate,
      couponId,
      anticipatedBooking,
      bookingNextState
    );
  }
  @Query(() => [BookingEntity], {
    name: "GetBookingsFromTheCurrentDayOfBuilding",
  })
  @UseGuards(JwtAuthGuard)
  GetBookingsFromTheCurrentDayOfBuilding(
    @Args("buildingId") buildingId: string
  ) {
    return this.bookingService.getBookingsFromTheCurrentDayOfBuilding(
      buildingId
    );
  }
}
