import { ArgsType, Field, InputType } from "@nestjs/graphql";
import { Column } from "typeorm";

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
  coords: string
  @Field(() => String)
  tax: number
  @Field(() => String)
  buildingPositionCode: string
  @Field(() => String, {nullable: true})
  photo: string
  @Field(() => String)
  pricePerMinute: number
  @Field(() => String)
  priceMonthly: number
  @Field(() => String)
  priceYearly: number
}