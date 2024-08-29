import { InputType, Int, Field, PartialType, ArgsType } from "@nestjs/graphql";
import { CreateUserInput } from "./create-user.input";
import { Column } from "typeorm";

@InputType()
@ArgsType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => String)
  id: string;
  @Field(() => Number, { nullable: true })
  cardNumbers?: number;
  @Field(() => String, { nullable: true })
  subscriptionToken?: string;
  @Field(() => String, { nullable: true })
  cardType?: string;
}
