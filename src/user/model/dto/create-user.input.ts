import { InputType, Int, Field, ArgsType, ObjectType } from "@nestjs/graphql";
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
  @Field(() => Boolean, { nullable: true })
  supplier: boolean;
  @Field(() => Boolean, { nullable: true })
  whitelisted: boolean;
}
@ObjectType()
export class OutputCreateUserInput extends BasicCustomerInputAbstract {
  @Field(() => Int, { nullable: true })
  wallet: number;
  @Field(() => String, { nullable: true })
  licenseDriver: string;
  @Field(() => String, { nullable: true })
  dniPhoto: string;
  @Field(() => Boolean, { nullable: true })
  supplier: boolean;
  @Field(() => Boolean, { nullable: true })
  whitelisted: boolean;
}