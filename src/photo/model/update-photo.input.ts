import { ArgsType, Field, InputType, PartialType } from "@nestjs/graphql";
import { CreatePhotoInput } from "./create-photo.input";

@InputType()
@ArgsType()
export class UpdatePhotoInput extends PartialType(CreatePhotoInput) {
  @Field(() => String)
  id: string;
}
