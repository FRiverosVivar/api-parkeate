import { ArgsType, Field, InputType, Int } from "@nestjs/graphql";
import { LiquidationEnum } from "../../../liquidation/model/liquidation.enum";

@InputType()
@ArgsType()
export class CreateLiquidationInput {

  @Field(() => Number)
  priceToBeLiquidated: number;
  @Field(() => String)
  liquidatedBy: string;
  @Field(() => Int)
  liquidationType: LiquidationEnum;
}
