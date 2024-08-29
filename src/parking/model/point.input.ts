import { ArgsType, Field, InputType } from "@nestjs/graphql";
export type Coordinates = [Lat, Lng];
export type Lng = number;
export type Lat = number;
@InputType()
@ArgsType()
export class PointInput {
  @Field(() => String)
  type: "Point";
  @Field(() => [Number])
  coordinates: Coordinates;
}
