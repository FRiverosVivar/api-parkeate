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
import { Observable } from "rxjs";
import { CurrentUser } from "../../auth/decorator/current-user.decorator";
import { UserEntity } from "../../user/entity/user.entity";

@Resolver(BookingEntity)
export class BookingResolver {
  constructor(private readonly bookingService: BookingService) {}

  @Mutation(() => BookingEntity)
  @UseGuards(JwtAuthGuard)
  createBooking(
    @Args('createBookingInput') createBookingInput: CreateBookingInput,
    @Args('parkingId') parkingId: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.bookingService.createBooking(createBookingInput, parkingId, user.id);
  }
  @Mutation(() => BookingEntity)
  updateBooking(
    @Args('updateBookingInput') updateBookingInput: UpdateBookingInput,
  ) {
    return this.bookingService.updateBooking(updateBookingInput);
  }
  @Mutation(() => BookingEntity)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(UserTypeGuard)
  removeBooking(
    @Args('bookingId') bookingId: string,
  ) {
    return this.bookingService.removeBooking(bookingId);
  }
  @Query(() => Int)
  getOrderNumberByCountingBookings(): Observable<number> {
    return this.bookingService.getBookingCountForOrderNumber()
  }
  @Query(() => BookingEntity)
  findBookingById(
    @Args('bookingId') bookingId: string,
  ) {
    return this.bookingService.findBookingById(bookingId);
  }
  @Query(() => BookingEntity)
  updateBookingParking(
    @Args('bookingId') bookingId: string,
    @Args('parkingId') parkingId: string) {
    return this.bookingService.changeBookingParking(bookingId,parkingId)
  }
  @Query(() => BookingEntity)
  updateBookingUser(
    @Args('bookingId') bookingId: string,
    @Args('userId') userId: string
  ) {
    return this.bookingService.changeBookingUser(bookingId, userId)
  }
  @Query(() => BookingEntity)
  @UseGuards(JwtAuthGuard)
  getActiveBookingByUserId(@CurrentUser() user: UserEntity) {
    this.bookingService.findActiveBookingByUserId(user.id);
  }
}
