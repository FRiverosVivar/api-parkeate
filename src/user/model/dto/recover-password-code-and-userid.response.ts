import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class RecoverPasswordCodeAndUserId {
  @Field(() => String)
  id: string;
  @Field(() => Number)
  code: number;
}
