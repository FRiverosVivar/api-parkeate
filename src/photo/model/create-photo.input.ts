import { ArgsType, Field, InputType } from "@nestjs/graphql";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";

@InputType()
@ArgsType()
export class CreatePhotoInput {
  @Field(() => String, { nullable: true })
  url?: string;
  @Field(() => String)
  name: string;
  @Field(() => String)
  creatorId: string;
}
