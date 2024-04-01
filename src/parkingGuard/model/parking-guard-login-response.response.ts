import { Field, ObjectType } from "@nestjs/graphql";
import { ParkingGuardEntity } from "../entity/parkingGuard.entity";

@ObjectType()
export class ParkingGuardLoginResponse {
  @Field(() => ParkingGuardEntity)
  guard: ParkingGuardEntity;

  @Field(() => String)
  access_token: string;
}
