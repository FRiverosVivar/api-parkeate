import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from "typeorm";
import { BookingEntity } from "../entity/booking.entity";
import { DateTime } from "luxon";

@EventSubscriber()
export class BookingSubscriber
  implements EntitySubscriberInterface<BookingEntity>
{
  listenTo() {
    return BookingEntity;
  }

  async beforeInsert(event: InsertEvent<BookingEntity>) {
    const date = DateTime.now().toFormat("ddMMyy");
    const bookingRepository = event.connection.getRepository(BookingEntity);
    const lastBookings = await bookingRepository.find({
      order: {
        numberId: "DESC",
      },
      take: 1,
    });
    const lastBooking = lastBookings.pop();
    const lastNum = lastBooking
      ? parseInt(
          lastBooking.numberId.slice(0, lastBooking.numberId.length - 6)
        ) + 1
      : 1;
    event.entity.numberId = `${lastNum}${date}`;
  }
}
