import {
  Column,
  Entity, OneToMany
} from "typeorm";
import { Field, ObjectType } from '@nestjs/graphql';
import { UserTypesEnum } from '../constants/constants';
import { BaseCustomer } from '../../utils/interfaces/base-customer.abstract';
import { ParkingEntity } from "../../parking/entity/parking.entity";

@Entity('user')
@ObjectType()
export class UserEntity extends BaseCustomer {
  @Column({ type: 'enum', enum: UserTypesEnum })
  @Field(() => UserTypesEnum, { description: 'type of the user' })
  userType: UserTypesEnum;
  @OneToMany(() => ParkingEntity, (p) => p.userOwner, {onUpdate: "CASCADE", onDelete: "CASCADE"})
  @Field(() => [ParkingEntity])
  parkingList: ParkingEntity[];
  @Column()
  @Field(() => Boolean, { description: 'validated email' })
  validatedEmail: boolean;
  @Column()
  @Field(() => Boolean, { description: 'validated phone' })
  validatedPhone: boolean;
}
