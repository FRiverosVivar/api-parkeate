import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class SmsVerificationCode {
  @Field(() => Number)
  smsCode: number;
}
