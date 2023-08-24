import { ArgsType, Field, InputType } from "@nestjs/graphql";

@InputType()
@ArgsType()
export class CreateRequestInput {
  @Field(() => String)
  subject: string
  @Field(() => String)
  email: string
  @Field(() => String)
  phoneNumber: string
  @Field(() => String)
  content: string
}
