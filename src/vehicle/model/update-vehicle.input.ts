import { ArgsType, Field, InputType, PartialType } from "@nestjs/graphql";
import { CreateVehicleInput } from "./create-vehicle.input";

@InputType()
@ArgsType()
export class UpdateVehicleInput extends PartialType(CreateVehicleInput) {
  @Field(() => String)
  id: string
}