import { Field, ObjectType } from "@nestjs/graphql";
import { UserEntity } from "../../entity/user.entity";

@ObjectType()
export class UserLoginResponse {
  @Field(() => UserEntity)
  user: UserEntity;

  @Field(() => String)
  access_token: string;
}
