import { Field, ObjectType } from "@nestjs/graphql";
import { BuildingEntity } from "../entity/building.entity";

@ObjectType()
export class MostProfitableBuilding {
  @Field(() => BuildingEntity)
  building: BuildingEntity;
  @Field(() => Number)
  totalPrice: number;
}
