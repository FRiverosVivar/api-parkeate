import { InputType, Int, Field, ArgsType } from '@nestjs/graphql';
import { UserTypesEnum } from '../../constants/constants';
import { BasicCustomerInputAbstract } from "../../../utils/interfaces/basic-customer-input.abstract";
import { Column } from "typeorm";

@InputType()
@ArgsType()
export class CreateUserInput extends BasicCustomerInputAbstract {
  @Field(() => Int, { description: 'type of the user' })
  userType: UserTypesEnum;
  @Field(() => Int, { nullable: true})
  wallet: number
  @Field(() => String, { nullable: true})
  licenseDriver: string
  @Field(() => String, { nullable: true})
  dniPhoto: string
}
