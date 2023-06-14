import { ArgsType, Field, InputType, PartialType } from "@nestjs/graphql";
import { CreateBookingInput } from "./create-booking.input";

@InputType()
@ArgsType()
export class UpdateBookingInput extends PartialType(CreateBookingInput) {
  @Field(() => String)
  id: string
}