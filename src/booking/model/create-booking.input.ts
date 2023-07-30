import { ArgsType, Field, InputType, Int } from "@nestjs/graphql";
import { BookingTypesEnum } from "../enum/booking-types.enum";
import { BookingStatesEnum } from "../enum/booking-states.enum";

@InputType()
@ArgsType()
export class CreateBookingInput {
  @Field(() => Int)
  bookingType: BookingTypesEnum
  @Field(() => Int)
  bookingState: BookingStatesEnum
  @Field(() => Number)
  initialPrice: number
  @Field(() => String)
  dateStart: string
  @Field(() => String, {nullable: true})
  dateEnd: string
  @Field(() => Boolean)
  paid: boolean
}
