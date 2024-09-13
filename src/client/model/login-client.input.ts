import { ArgsType, Field, InputType } from "@nestjs/graphql";

@InputType()
@ArgsType()
export class LoginClientInput {
  @Field(() => String, { description: "rut of the user" })
  username: string;

  @Field(() => String, { description: "pw of the user" })
  password: string;
}
