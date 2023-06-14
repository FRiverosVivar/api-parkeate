import { ChildEntity, Column, Entity, JoinColumn, JoinTable, ManyToOne, OneToMany } from "typeorm";
import { Field, ObjectType } from '@nestjs/graphql';
import { BaseCustomer } from '../../utils/interfaces/base-customer.abstract';
import { ParkingEntity } from "../../parking/entity/parking.entity";
import { HoldingEntity } from "../../holding/entity/holding.entity";

@Entity('client')
@ObjectType()
export class ClientEntity extends BaseCustomer {
  @Column()
  @Field(() => Boolean)
  validatedAccount: boolean;
  @OneToMany(() => ParkingEntity, (p) => p.clientOwner)
  @Field(() => [ParkingEntity])
  parkingList: ParkingEntity[];
  @ManyToOne(() => HoldingEntity, (h) => h.clientList)
  @JoinColumn([
    { name: "holdingId", referencedColumnName: "id" }]
  )
  @Field(() => HoldingEntity)
  holding: HoldingEntity
}
