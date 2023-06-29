import { UserEntity } from '../../entity/user.entity';
import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class UserWithVerificationCode {
  @Field(() => UserEntity)
  user: UserEntity;
  @Field(() => Number)
  code: number;
}
