import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  OneToMany, OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Field, ObjectType } from "@nestjs/graphql";
import { PhotoEntity } from "../../photo/entity/photo.entity";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";
import { MultiplePhotosEntity } from "../../photo/entity/multiple-photos.entity";

@Entity('building')
@ObjectType()
export class BuildingEntity extends BaseEntityWithIdAbstract {
  @Column()
  @Field(() => String, { description: 'address of the building' })
  address: string;
  @Column()
  @Field(() => String, { description: 'phone number of the building' })
  phoneNumber: string;
  @Column()
  @Field(() => String, { description: 'photos of the building'})
  photos: string;
  @Column()
  @Field(() => String, { description: 'parkings of the building'})
  parkingList: string;
}

