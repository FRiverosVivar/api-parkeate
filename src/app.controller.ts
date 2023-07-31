import { Body, Controller, Get, OnModuleInit, Post, Query } from "@nestjs/common";
import { BookingService } from "./booking/service/booking.service";
import { BookingEntity } from "./booking/entity/booking.entity";
import { Observable } from "rxjs";
import { UpdateBookingInput } from "./booking/model/update-booking.input";
import { BookingStatesEnum } from "./booking/enum/booking-states.enum";
import { ParkingService } from "./parking/service/parking.service";
import { BuildingService } from "./building/service/building.service";
import { CreateBuildingInput } from "./building/model/create-building.input";
import { TagsService } from "./tags/service/tags.service";
import { CreateTagInput } from "./tags/model/create-tag.input";
import { CreateParkingInput } from "./parking/model/create-parking.input";
import { ParkingType } from "./parking/model/parking-type.enum";

@Controller('/booking/confirmPayment')
export class AppController {
  constructor(
    private readonly bookingService: BookingService,
    private buildingService: BuildingService,
    private parkingService: ParkingService,
    private tagsService: TagsService
  ) {}

  @Get('')
  updateBookingToReservedStatus(@Query('bookingId') bookingId: string, @Body() body: any): Observable<BookingEntity> {
    console.log(body)
    const updateBookingInput: UpdateBookingInput = {
      id: bookingId,
      bookingState: BookingStatesEnum.RESERVED,
    }
    return this.bookingService.updateBooking(updateBookingInput);
  }
  @Post('')
  updateBookingReservedStatus(@Query('bookingId') bookingId: string, @Body() body: any): Observable<BookingEntity> {
    console.log(body)
    const updateBookingInput: UpdateBookingInput = {
      id: bookingId,
      bookingState: BookingStatesEnum.RESERVED,
    }
    return this.bookingService.updateBooking(updateBookingInput);
  }
  @Get('/extended')
  successPaymentExtraTime(@Query('bookingId') bookingId: string, @Query('mountPaid') mountPaid: number): Observable<BookingEntity> {
    const updateBookingInput: UpdateBookingInput = {
      id: bookingId,
      paid: true,
      mountPaid: mountPaid
    }
    return this.bookingService.updateBooking(updateBookingInput);
  }
}
