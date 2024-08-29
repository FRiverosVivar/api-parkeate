import { ArgsType, Field, InputType, PartialType } from "@nestjs/graphql";
import { CreateHoldingInput } from "./create-holding.input";
@InputType()
@ArgsType()
export class UpdateHoldingInput extends PartialType(CreateHoldingInput) {
  @Field(() => String)
  id: string;
}
