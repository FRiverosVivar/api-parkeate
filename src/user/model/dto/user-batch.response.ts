import { Field, ObjectType } from "@nestjs/graphql";
import { UserEntity } from "../../entity/user.entity";
import { CreateUserInput, OutputCreateUserInput } from "./create-user.input";

@ObjectType()
export class UserBatchResponse {
  @Field(() => [UserEntity])
  created: UserEntity[];

  @Field(() => [OutputCreateUserInput])
  failed: OutputCreateUserInput[];
}
