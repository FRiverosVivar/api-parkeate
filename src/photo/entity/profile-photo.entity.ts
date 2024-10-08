import { Field, ObjectType } from "@nestjs/graphql";
import { Entity, ManyToOne, OneToOne } from "typeorm";
import { ProfilePhotoAbstract } from "../model/profile-photo.abstract";
import { BasicProfileAbstract } from "../../utils/interfaces/basic-profile.abstract";

@ObjectType()
@Entity()
export class ProfilePhotoEntity extends ProfilePhotoAbstract {
  @OneToOne(() => BasicProfileAbstract, { eager: true })
  @Field(() => String)
  entity: string;
}
