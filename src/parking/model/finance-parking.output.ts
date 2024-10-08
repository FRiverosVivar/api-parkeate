import { Field, ObjectType } from "@nestjs/graphql";
import { ParkingEntity } from "../entity/parking.entity";

@ObjectType()
export class MostProfitableParking {
  @Field(() => ParkingEntity)
  parking: ParkingEntity;
  @Field(() => Number)
  totalPrice: number;
}
export interface RawParkingMostRentedOfDay {
  parkingId: string;
  quantityOfBookings: number;
}
@ObjectType()
export class MostRentedParking {
  @Field(() => ParkingEntity)
  parking: ParkingEntity;
  @Field(() => Number)
  quantity: number;
}
@ObjectType()
export class TopMostRentedParkings {
  @Field(() => MostRentedParking, { nullable: true })
  monday: MostRentedParking | undefined;
  @Field(() => MostRentedParking, { nullable: true })
  tuesday: MostRentedParking | undefined;
  @Field(() => MostRentedParking, { nullable: true })
  wednesday: MostRentedParking | undefined;
  @Field(() => MostRentedParking, { nullable: true })
  thursday: MostRentedParking | undefined;
  @Field(() => MostRentedParking, { nullable: true })
  friday: MostRentedParking | undefined;
  @Field(() => MostRentedParking, { nullable: true })
  saturday: MostRentedParking | undefined;
  @Field(() => MostRentedParking, { nullable: true })
  sunday: MostRentedParking | undefined;
}
