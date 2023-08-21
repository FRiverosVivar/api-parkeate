import { ChildEntity, Column, Entity, JoinColumn, JoinTable, ManyToOne, OneToMany } from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";
import { BaseCustomer } from '../../utils/interfaces/base-customer.abstract';
import { ParkingEntity } from "../../parking/entity/parking.entity";
import { HoldingEntity } from "../../holding/entity/holding.entity";
import { BuildingEntity } from "../../building/entity/building.entity";
import { UserTypesEnum } from "../../user/constants/constants";

@Entity('client')
@ObjectType()
export class ClientEntity extends BaseCustomer {
  @Column({ type: 'enum', enum: UserTypesEnum})
  @Field(() => Int, { description: 'type of the user' })
  userType: UserTypesEnum;
  @OneToMany(() => ParkingEntity, (p) => p.client)
  @Field(() => [ParkingEntity])
  parkingList: ParkingEntity[];
  @OneToMany(() => BuildingEntity, (b) => b.client)
  @Field(() => [BuildingEntity])
  buildings: BuildingEntity[];
  @ManyToOne(() => HoldingEntity, (h) => h.clientList, {nullable: true})
  @Field(() => HoldingEntity, {nullable: true})
  holding: HoldingEntity
}
