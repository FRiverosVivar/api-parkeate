import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class EmailVerificationCode {
  @Field(() => Number)
  code: number;
}
