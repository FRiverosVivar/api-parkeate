import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class CreateTbkTransactionResponse {
  @Field(() => String)
  token: string;
  @Field(() => String)
  url: string;
}
