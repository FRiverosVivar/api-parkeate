import { ArgsType, Field, InputType, PartialType } from "@nestjs/graphql";
import { CreateBuildingInput } from "./create-building.input";

@InputType()
@ArgsType()
export class UpdateBuildingInput extends PartialType(CreateBuildingInput) {
  @Field(() => String, { description: 'id of the building' })
  id: string;
  @Field(() => Boolean, { nullable: true })
  active: boolean;
}
