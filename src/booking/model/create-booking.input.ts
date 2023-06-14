import { ArgsType, Field, InputType } from "@nestjs/graphql";
import { BookingTypesEnum } from "../enum/booking-types.enum";
import { BookingStatesEnum } from "../enum/booking-states.enum";

@InputType()
@ArgsType()
export class CreateBookingInput {
  @Field(() => BookingTypesEnum)
  bookingType: BookingTypesEnum
  @Field(() => BookingStatesEnum, {defaultValue: BookingStatesEnum.RESERVED})
  bookingState: BookingStatesEnum
  @Field(() => Number)
  initialPrice: number
  @Field(() => Date)
  dateStart: Date
  @Field(() => Date)
  dateEnd: Date
  @Field(() => Date)
  dateExtended: Date
  @Field(() => Date)
  timeFinalized: Date
  @Field(() => Number)
  finalPrice: number
}