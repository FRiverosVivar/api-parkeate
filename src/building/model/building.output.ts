import { Field, ObjectType } from "@nestjs/graphql";
import { BuildingEntity } from "../entity/building.entity";

@ObjectType()
export class BuildingOutput extends BuildingEntity {
  @Field(() => String)
  min: string;
  @Field(() => String)
  coords: string;
}
