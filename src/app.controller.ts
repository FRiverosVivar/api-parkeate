import { Controller, Get, Param } from "@nestjs/common";
import { BookingService } from "./booking/service/booking.service";
import { BookingEntity } from "./booking/entity/booking.entity";
import { Observable } from "rxjs";
import { UpdateBookingInput } from "./booking/model/update-booking.input";
import { BookingStatesEnum } from "./booking/enum/booking-states.enum";

@Controller('/booking/confirmPayment')
export class AppController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  updateBookingToReservedStatus(@Param('bookingId') bookingId: string): Observable<BookingEntity> {
    const updateBookingInput: UpdateBookingInput = {
      id: bookingId,
      bookingState: BookingStatesEnum.RESERVED,
    }
    return this.bookingService.updateBooking(updateBookingInput);
  }
}
