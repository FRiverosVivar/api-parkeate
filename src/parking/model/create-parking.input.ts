import { ArgsType, Field, Float, InputType } from "@nestjs/graphql";
import { GeometryGQL } from "../scalar/point.scalar";
import { Point } from "typeorm";
import { Geometry } from "geojson";
import { PointInput } from "./point.input";
import { ParkingType } from "./parking-type.enum";

@InputType()
@ArgsType()
export class CreateParkingInput {
  @Field(() => String)
  name: string
  @Field(() => String)
  address: string
  @Field(() => Boolean)
  reserved: boolean
  @Field(() => Boolean)
  active: boolean
  @Field(() => Boolean)
  blocked: boolean
  @Field(() => PointInput)
  location: PointInput
  @Field(() => String)
  tax: string
  @Field(() => String)
  buildingPositionCode: string
  @Field(() => String, {nullable: true})
  photo: string
  @Field(() => String)
  pricePerMinute: string
  @Field(() => String)
  priceMonthly: string
  @Field(() => String)
  priceYearly: string
  @Field(() => ParkingType)
  type: ParkingType;
}
