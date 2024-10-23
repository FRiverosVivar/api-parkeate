import { ArgsType, Field, InputType, PartialType } from "@nestjs/graphql";
import { CreateLiquidationInput } from "./create-liquidation.input";

@InputType()
@ArgsType()
export class UpdateLiquidationInput extends PartialType(
  CreateLiquidationInput
) {
  @Field(() => String)
  id: string;
}
