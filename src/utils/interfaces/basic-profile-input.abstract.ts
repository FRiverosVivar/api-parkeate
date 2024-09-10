import { ArgsType, Field, InputType } from "@nestjs/graphql";
import { PhotoEntity } from "../../photo/entity/photo.entity";
@InputType()
@ArgsType()
export abstract class BasicProfileInputAbstract {
  @Field(() => String, { description: "rut of the user" })
  rut: string;
  @Field(() => String, { description: "name of the holding" })
  fullname: string;
  @Field(() => String, { description: "email of the user" })
  email: string;
  @Field(() => String, { description: "phone number of the user" })
  phoneNumber: string;
  @Field(() => String, { description: "photo of the user", nullable: true })
  profilePhoto: string;
}
