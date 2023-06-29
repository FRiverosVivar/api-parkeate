import { UserEntity } from '../../entity/user.entity';
import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class UserWithSmsCode {
  @Field(() => UserEntity)
  user: UserEntity;
  @Field(() => Number)
  smsCode: number;
}
