import { BasicProfileInputAbstract } from "./basic-profile-input.abstract";
import { ArgsType, Field, InputType } from "@nestjs/graphql";

@InputType()
@ArgsType()
export class BasicCustomerInputAbstract extends BasicProfileInputAbstract {
  @Field(() => String, { description: 'hashed password of the user' })
  password: string;
  @Field(() => Boolean)
  validatedAccount: boolean;
  @Field(() => Boolean, { description: 'validated email'})
  validatedEmail: boolean;
  @Field(() => Boolean, { description: 'validated phone'})
  validatedPhone: boolean;
}
