import { ArgsType, Field, Float, InputType, Int } from "@nestjs/graphql";
import { GeometryGQL } from "../scalar/point.scalar";
import { Column, Point } from "typeorm";
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
  @Field(() => String)
  tax: string
  @Field(() => Int)
  floor: number
  @Field(() => String)
  section: string
  @Field(() => String)
  code: string
  @Field(() => String, {nullable: true})
  photo: string
  @Field(() => String)
  pricePerMinute: string
  @Field(() => String)
  priceMonthly: string
  @Field(() => String)
  priceYearly: string
  @Field(() => Int)
  type: number;
  @Field(() => String, {nullable: true})
  description?: string
  @Field(() => String)
  phone: string
}
