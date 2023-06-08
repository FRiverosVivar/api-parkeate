import { ChildEntity, Column, Entity, OneToMany } from "typeorm";
import { Field, ObjectType } from '@nestjs/graphql';
import { BaseCustomer } from '../../utils/interfaces/base-customer.abstract';
import { ParkingEntity } from "../../parking/entity/parking.entity";

@Entity('client')
@ObjectType()
export class ClientEntity extends BaseCustomer {
  @Column()
  @Field(() => Boolean)
  validatedAccount: boolean;
  @OneToMany(() => ParkingEntity, (p) => p.clientOwner)
  @Field(() => [ParkingEntity])
  parkingList: ParkingEntity[];
}
