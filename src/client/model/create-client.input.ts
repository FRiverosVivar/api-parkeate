import { ArgsType, Field, Float, InputType, Int } from '@nestjs/graphql';
import { BasicCustomerInputAbstract } from "../../utils/interfaces/basic-customer-input.abstract";
import { LiquidationEnum } from 'src/liquidation/model/liquidation.enum';
import { BankAccountTypeEnum, BanksEnum } from './bank.enum';

@InputType()
@ArgsType()
export class CreateClientInput extends BasicCustomerInputAbstract {
    @Field(() => Int)
    preferedLiquidationPayRate: LiquidationEnum
    @Field(() => Int)
    bankType: BanksEnum
    @Field(() => String)
    bankAccountEmail: string
    @Field(() => String)
    bankAccountName: string
    @Field(() => Int)
    bankAccountType: BankAccountTypeEnum
    @Field(() => String)
    bankAccountNumber: string
}
