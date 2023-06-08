import { InputType, Int, Field, ArgsType } from '@nestjs/graphql';
import { UserTypesEnum } from '../../constants/constants';
import { BasicCustomerInputAbstract } from "../../../utils/interfaces/basic-customer-input.abstract";
import { CreateParkingInput } from "../../../parking/model/create-parking.input";

@InputType()
@ArgsType()
export class CreateUserInput extends BasicCustomerInputAbstract {
  @Field(() => Int, { description: 'type of the user' })
  userType: UserTypesEnum;
  @Field(() => Boolean, { description: 'validated email' })
  validatedEmail: boolean;
  @Field(() => Boolean, { description: 'validated phone' })
  validatedPhone: boolean;
}
