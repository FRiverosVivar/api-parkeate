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

@Resolver(BookingEntity)
export class BookingResolver {
  constructor(private readonly bookingService: BookingService) {}

  @Mutation(() => BookingEntity)
  createBooking(
    @Args('createBookingInput') createBookingInput: CreateBookingInput,
    @Args('parkingId') parkingId: string,
    @Args('userId') userId: string,
  ) {
    return this.bookingService.createBooking(createBookingInput, parkingId, userId);
  }
  @Mutation(() => BookingEntity)
  updateBooking(
    @Args('updateBookingInput') updateBookingInput: UpdateBookingInput,
    @Args('parkingId') parkingId: string,
    @Args('userId') userId: string,
  ) {
    return this.bookingService.updateBooking(updateBookingInput, parkingId, userId);
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
}
