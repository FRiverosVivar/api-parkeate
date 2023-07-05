import { ArgsType, Field, InputType } from "@nestjs/graphql";
import { PhotoEntity } from "../../photo/entity/photo.entity";
import { Column } from "typeorm";

@InputType()
@ArgsType()
export class CreateBuildingInput {
  @Field(() => String, { description: 'address of the building' })
  address: string;
  @Field(() => String, { description: 'phone number of the building' })
  phoneNumber: string;
  @Field(() => String, { description: 'photo of the building'})
  photo: string;
  @Field(() => String, { description: 'name of the building' })
  name: string;
}
