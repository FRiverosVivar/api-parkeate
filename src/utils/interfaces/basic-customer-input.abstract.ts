import { BasicProfileInputAbstract } from "./basic-profile-input.abstract";
import { Field } from "@nestjs/graphql";

export class BasicCustomerInputAbstract extends BasicProfileInputAbstract {
  @Field(() => String, { description: 'hashed password of the user' })
  password: string;
  @Field(() => String)
  parkingList: string;
}