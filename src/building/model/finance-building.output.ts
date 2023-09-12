import { Field, ObjectType } from "@nestjs/graphql";
import { BuildingEntity } from "../entity/building.entity";

@ObjectType()
export class MostProfitableBuilding {
  @Field(() => BuildingEntity)
  building: BuildingEntity;
  @Field(() => Number)
  totalPrice: number;
}
@ObjectType()
export class WeeklyBuildingProfit {
  @Field(() => [Number])
  weeklyBuildingProfit: number[];
}
export interface FinalPrice {
  finalPrice: number;
}
