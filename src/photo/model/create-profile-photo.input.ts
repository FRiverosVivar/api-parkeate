import { ArgsType, Field, InputType } from "@nestjs/graphql";
import { CreatePhotoInput } from "./create-photo.input";
import { BasicProfileAbstract } from "../../utils/interfaces/basic-profile.abstract";

@InputType()
@ArgsType()
export class CreateProfilePhotoInput extends CreatePhotoInput {
  @Field(() => BasicProfileAbstract)
  entity: BasicProfileAbstract;
}
