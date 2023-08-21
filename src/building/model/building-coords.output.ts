import { Field, ObjectType } from "@nestjs/graphql";
import { BuildingEntity } from "../entity/building.entity";

@ObjectType()
export class BuildingWithCoordsOutput extends BuildingEntity {
  @Field(() => String)
  coords: string;
}
