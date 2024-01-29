import { InputType, Int, Field, ArgsType } from "@nestjs/graphql";
import { BasicCustomerInputAbstract } from "../../../utils/interfaces/basic-customer-input.abstract";

@InputType()
@ArgsType()
export class CreateUserInput extends BasicCustomerInputAbstract {
  @Field(() => Int, { nullable: true })
  wallet: number;
  @Field(() => String, { nullable: true })
  licenseDriver: string;
  @Field(() => String, { nullable: true })
  dniPhoto: string;
  @Field(() => String, { nullable: true })
  supplier: boolean;
}
