import { ArgsType, Field, Float, InputType, Int } from "@nestjs/graphql";
import { BasicCustomerInputAbstract } from "../../utils/interfaces/basic-customer-input.abstract";
import { LiquidationEnum } from "src/liquidation/model/liquidation.enum";
import { BankAccountTypeEnum, BanksEnum } from "./bank.enum";

@InputType()
@ArgsType()
export class CreateClientInput extends BasicCustomerInputAbstract {
  @Field(() => Int)
  preferedLiquidationPayRate: LiquidationEnum;
  @Field(() => Int, { nullable: true })
  bankType: BanksEnum;
  @Field(() => String, { nullable: true })
  bankAccountEmail: string;
  @Field(() => String, { nullable: true })
  bankAccountName: string;
  @Field(() => Int, { nullable: true })
  bankAccountType: BankAccountTypeEnum;
  @Field(() => String, { nullable: true })
  bankAccountNumber: string;
  @Field(() => String, { nullable: true })
  supplier: boolean;
}
