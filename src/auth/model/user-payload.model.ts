import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { UserTypesEnum } from "../../user/constants/constants";

@InputType()
@ArgsType()
export class UserPayload {
  @Field(() => String)
  username: string;
  @Field(() => String)
  sub: string;
  @Field(() => UserTypesEnum)
  userType: UserTypesEnum
}
