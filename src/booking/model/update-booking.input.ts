import { ArgsType, Field, InputType, PartialType } from "@nestjs/graphql";
import { CreateBookingInput } from "./create-booking.input";

@InputType()
@ArgsType()
export class UpdateBookingInput extends PartialType(CreateBookingInput) {
  @Field(() => String)
  id: string
  @Field(() => Date, {nullable: true})
  dateExtended?: Date
  @Field(() => Date, {nullable: true})
  timeFinalized?: Date
  @Field(() => Number, {nullable: true})
  finalPrice?: number
  @Field(() => Number, {nullable: true})
  mountPaid?: number
}
