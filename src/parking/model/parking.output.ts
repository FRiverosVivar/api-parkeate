import { Field, ObjectType } from "@nestjs/graphql";
import { ParkingEntity } from "../entity/parking.entity";

@ObjectType()
export class ParkingOutput extends ParkingEntity {
  @Field(() => String)
  coords: string;
}
