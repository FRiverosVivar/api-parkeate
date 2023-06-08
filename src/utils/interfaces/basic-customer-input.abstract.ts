import { BasicProfileInputAbstract } from "./basic-profile-input.abstract";
import { ArgsType, Field, InputType } from "@nestjs/graphql";

@InputType()
@ArgsType()
export class BasicCustomerInputAbstract extends BasicProfileInputAbstract {
  @Field(() => String, { description: 'hashed password of the user' })
  password: string;
  @Field(() => String)
  parkingList: string;
}