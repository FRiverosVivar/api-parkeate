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
@ObjectType()
export class MonthlyBuildingProfit {
  @Field(() => [MonthlyFinalPrice])
  monthlyBuildingProfit: MonthlyFinalPrice[];
}
export interface FinalPrice {
  finalPrice: number;
}
@ObjectType()
export class MonthlyFinalPrice {
  @Field(() => Number, { nullable: true })
  dailyIncome: number;
  @Field(() => Number, { nullable: true })
  bookingsCount: number;
  @Field(() => Date)
  day: Date;
}
