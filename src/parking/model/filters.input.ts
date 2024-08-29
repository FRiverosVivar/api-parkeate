import { ArgsType, Field, InputType, Int } from "@nestjs/graphql";
import { ParkingType } from "./parking-type.enum";

@InputType()
@ArgsType()
export class FiltersInput {
  @Field(() => Number, { nullable: true })
  priceMonthly?: number;
  @Field(() => Number, { nullable: true })
  pricePerMinute?: number;
  @Field(() => Int, { nullable: true })
  parkingType?: ParkingType;
}
