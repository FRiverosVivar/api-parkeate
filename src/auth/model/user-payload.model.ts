import { ArgsType, Field, InputType } from '@nestjs/graphql';

@InputType()
@ArgsType()
export class UserPayload {
  @Field(() => String)
  username: string;
  @Field(() => String)
  sub: string;
}
