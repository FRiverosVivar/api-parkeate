import { ArgsType, Field, InputType } from "@nestjs/graphql";

@InputType()
@ArgsType()
export class CreateVehicleInput {
  @Field(() => String)
  model: string
  @Field(() => String, { description: 'patente'})
  carPlate: string
  @Field(() => String, { description: 'color'})
  color: string
}