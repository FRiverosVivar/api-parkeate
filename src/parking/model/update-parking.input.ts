import { ArgsType, Field, InputType, PartialType } from "@nestjs/graphql";
import { CreateParkingInput } from "./create-parking.input";

@InputType()
@ArgsType()
export class UpdateParkingInput extends PartialType(CreateParkingInput) {
  @Field(() => String)
  id: string
}