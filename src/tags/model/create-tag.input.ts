import { ArgsType, Field, InputType } from "@nestjs/graphql";
import { ParkingEntity } from "../../parking/entity/parking.entity";

@InputType()
@ArgsType()
export class CreateTagInput {
  @Field(() => String)
  name: string
  @Field( () => String)
  color: string
  @Field(() => String)
  icon: string
}