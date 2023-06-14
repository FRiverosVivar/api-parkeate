import { ArgsType, Field, InputType } from "@nestjs/graphql";
import { PhotoEntity } from "../../photo/entity/photo.entity";

@InputType()
@ArgsType()
export class CreateBuildingInput {
  @Field(() => Date, { description: 'creation date of the building' })
  createdAt: Date;
  @Field(() => Date, { description: 'creation date of the building' })
  updatedAt: Date;
  @Field(() => String, { description: 'address of the building' })
  address: string;
  @Field(() => String, { description: 'phone number of the building' })
  phoneNumber: string;
  @Field(() => String, { description: 'photo of the building'})
  photo: string;
}