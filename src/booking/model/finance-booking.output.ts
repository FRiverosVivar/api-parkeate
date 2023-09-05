import { Field, ObjectType } from "@nestjs/graphql";
import { BookingEntity } from "../entity/booking.entity";

@ObjectType()
export class BookingDailyFinance {
  @Field(() => Number)
  percentBetterFromYesterday: number;
  @Field(() => Number)
  numberOfBookingToday: number;
}
@ObjectType()
export class BookingDailyIncomeFinance {
  @Field(() => Number)
  percentBetterFromYesterday: number;
  @Field(() => Number)
  numberOfIncomeToday: number;
}

