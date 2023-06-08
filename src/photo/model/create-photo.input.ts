import { ArgsType, Field, InputType } from "@nestjs/graphql";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";

@InputType()
@ArgsType()
export class CreatePhotoInput {
  @Field(() => String)
  id: string;
  @Field(() => String, { nullable: true})
  url?: string;
  @Field(() => String, { nullable: true})
  name?: string;
  @Field(() => String, { nullable: true })
  creatorId: string;
}