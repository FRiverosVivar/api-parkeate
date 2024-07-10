import { Field, ObjectType } from "@nestjs/graphql";
import { UserEntity } from "../../entity/user.entity";
import { CreateUserInput } from "./create-user.input";

@ObjectType()
export class UserBatchResponse {
  @Field(() => [UserEntity])
  created: UserEntity[];

  @Field(() => [CreateUserInput])
  failed: CreateUserInput[];
}
