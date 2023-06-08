import { Column, OneToOne } from "typeorm";
import { Field, ObjectType } from "@nestjs/graphql";
import { PhotoEntity } from "../../photo/entity/photo.entity";
import { BaseEntityWithIdAbstract } from "./base-entity-with-id.abstract";
import { ProfilePhotoEntity } from "../../photo/entity/profile-photo.entity";

@ObjectType()
export abstract class BasicProfileAbstract extends BaseEntityWithIdAbstract{
  @Column()
  @Field(() => String, { description: 'photo of the user', nullable: true })
  profilePhoto: string;
  @Column({ unique: true })
  @Field(() => String, { description: 'rut of the user' })
  rut: string;
  @Column()
  @Field(() => String, { description: 'name of the holding' })
  fullname: string;
  @Column()
  @Field(() => String, { description: 'email of the user' })
  email: string;
  @Column()
  @Field(() => String, { description: 'phone number of the user' })
  phoneNumber: string;
}