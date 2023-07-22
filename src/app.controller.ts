import { Controller, Get, OnModuleInit, Query } from "@nestjs/common";
import { BookingService } from "./booking/service/booking.service";
import { BookingEntity } from "./booking/entity/booking.entity";
import { Observable } from "rxjs";
import { UpdateBookingInput } from "./booking/model/update-booking.input";
import { BookingStatesEnum } from "./booking/enum/booking-states.enum";
import { ParkingService } from "./parking/service/parking.service";
import { BuildingService } from "./building/service/building.service";

@Controller('/booking/confirmPayment')
export class AppController implements OnModuleInit {
  constructor(private readonly bookingService: BookingService, private buildingService: BuildingService, private parkingService: ParkingService) {}

  @Get('')
  updateBookingToReservedStatus(@Query('bookingId') bookingId: string): Observable<BookingEntity> {
    const updateBookingInput: UpdateBookingInput = {
      id: bookingId,
      bookingState: BookingStatesEnum.RESERVED,
    }
    return this.bookingService.updateBooking(updateBookingInput);
  }

  onModuleInit(): any {

  }
}
