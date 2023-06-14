import {
  Column,
  Entity, ManyToOne, OneToMany
} from "typeorm";
import { Field, ObjectType } from "@nestjs/graphql";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";
import { ParkingEntity } from "../../parking/entity/parking.entity";

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
  @OneToMany(() => ParkingEntity, (p) => p.building, {onDelete: "CASCADE"})
  @Field(() => ParkingEntity, { description: 'parkings of the building'})
  parkingList: ParkingEntity[];
}

