import { ArgsType, Field, InputType } from "@nestjs/graphql";
import { PointInput } from "../../parking/model/point.input";

@InputType()
@ArgsType()
export class CreateBuildingInput {
  @Field(() => String, { description: 'address of the building' })
  address: string;
  @Field(() => String, { description: 'phone number of the building' })
  phoneNumber: string;
  @Field(() => String, { description: 'photo of the building', nullable: true})
  photo: string;
  @Field(() => String, { description: 'name of the building' })
  name: string;
  @Field(() => PointInput)
  location: PointInput
  @Field(() => String)
  floors: string
  @Field(() => String, {nullable: true})
  description?: string
}
