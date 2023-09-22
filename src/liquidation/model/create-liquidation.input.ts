import { ArgsType, Field, InputType, Int } from "@nestjs/graphql";
import { LiquidationEnum } from "./liquidation.enum";

@InputType()
@ArgsType()
export class CreateLiquidationInput {
  @Field(() => Number)
  priceToBeLiquidated: number;
  @Field(() => String)
  liquidatedBy: string;
  @Field(() => Int)
  liquidationType: LiquidationEnum;
  @Field(() => Boolean)
  paid: boolean;
  @Field(() => String)
  liquidationReceipt: string;
  @Field(() => Boolean)
  approved: boolean;
  @Field(() => String)
  approvedBy: string;
  @Field(() => String)
  liquidatedPdf: string;
}
