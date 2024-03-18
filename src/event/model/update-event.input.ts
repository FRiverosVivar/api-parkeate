import { ArgsType, Field, InputType, PartialType } from "@nestjs/graphql";
import { CreateEventInput } from "./create-event.input";

@InputType()
@ArgsType()
export class UpdateEventInput extends PartialType(CreateEventInput) {
  @Field(() => String)
  id: string;
  @Field(() => Boolean, { nullable: true })
  active: boolean;
  @Field(() => String, { nullable: true })
  code: string;
}
