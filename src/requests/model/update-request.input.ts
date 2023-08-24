import { ArgsType, Field, InputType, PartialType } from "@nestjs/graphql";
import { CreateRequestInput } from "./create-request.input";

@InputType()
@ArgsType()
export class UpdateRequestInput extends PartialType(CreateRequestInput) {
  @Field(() => String)
  id: string
}
