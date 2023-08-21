import {
  Column,
  Entity, Index, JoinColumn, ManyToMany, ManyToOne, OneToMany, Point
} from "typeorm";
import { Field, ObjectType } from "@nestjs/graphql";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";
import { ParkingEntity } from "../../parking/entity/parking.entity";
import { ClientEntity } from "../../client/entity/client.entity";
import { GeometryGQL } from "../../parking/scalar/point.scalar";
import { TagsEntity } from "../../tags/entity/tags.entity";

@Entity('building')
@ObjectType()
export class BuildingEntity extends BaseEntityWithIdAbstract {
  @Column()
  @Field(() => String, { description: 'name of the building' })
  name: string;
  @Column()
  @Field(() => String, { description: 'address of the building' })
  address: string;
  @Column()
  @Field(() => String, { description: 'phone number of the building' })
  phoneNumber: string;
  @Column({ nullable: true})
  @Field(() => String, { description: 'photos of the building', nullable: true})
  photo: string;
  @ManyToOne(() => ClientEntity, (c) => c.buildings, {eager: true})
  @Field(() => ClientEntity)
  client: ClientEntity;
  @OneToMany(() => ParkingEntity, (p) => p.building, {eager: true, nullable: true})
  @Field(() => [ParkingEntity], { description: 'parkings of the building'})
  parkingList: ParkingEntity[];
  @ManyToMany(() => TagsEntity, (t) => t.buildings, {eager: true, nullable: true})
  @Field(() => [TagsEntity])
  tags: TagsEntity[]
  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  @Field(() => GeometryGQL)
  location: Point
  @Column()
  @Field(() => String)
  floors: string
  @Column({nullable: true, length: 255})
  @Field(() => String, {nullable: true})
  description?: string
}

