import { Field, ObjectType } from "@nestjs/graphql";
import { ParkingEntity } from "../entity/parking.entity";

@ObjectType()
export class MostProfitableParking {
  @Field(() => ParkingEntity)
  parking: ParkingEntity;
  @Field(() => Number)
  totalPrice: number;
}
