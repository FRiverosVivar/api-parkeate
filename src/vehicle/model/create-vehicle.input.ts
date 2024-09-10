import { ArgsType, Field, InputType, Int } from "@nestjs/graphql";
import { VehicleTypeEnum } from "./vehicle-type.enum";

@InputType()
@ArgsType()
export class CreateVehicleInput {
  @Field(() => String)
  model: string;
  @Field(() => String, { description: "patente" })
  carPlate: string;
  @Field(() => String, { description: "color" })
  color: string;
  @Field(() => Int, { description: "car type" })
  carType: VehicleTypeEnum;
}
