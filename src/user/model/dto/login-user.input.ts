import { ArgsType, Field, InputType } from "@nestjs/graphql";
import { UserTypesEnum } from "../../constants/constants";

@InputType()
@ArgsType()
export class LoginUserInput {
  @Field(() => String, { description: "rut of the user" })
  username: string;

  @Field(() => String, { description: "pw of the user" })
  password: string;
}
