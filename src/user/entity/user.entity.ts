import {
  Column,
  Entity, ManyToMany, OneToMany
} from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";
import { UserTypesEnum } from '../constants/constants';
import { BaseCustomer } from '../../utils/interfaces/base-customer.abstract';
import { ParkingEntity } from "../../parking/entity/parking.entity";
import { VehicleEntity } from "../../vehicle/entity/vehicle.entity";
import { BookingEntity } from "../../booking/entity/booking.entity";

@Entity('user')
@ObjectType()
export class UserEntity extends BaseCustomer {
  @Column({ type: 'enum', enum: UserTypesEnum })
  @Field(() => UserTypesEnum, { description: 'type of the user' })
  userType: UserTypesEnum;
  @ManyToMany(() => ParkingEntity, (p) => p.blockedUsers , {nullable: true})
  @Field(() => [ParkingEntity], { description: 'validated phone' , nullable: true})
  restrictedParkings: ParkingEntity[];
  @OneToMany(() => VehicleEntity, (v) => v.owner, {onUpdate: "CASCADE", nullable: true, eager: true})
  @Field(() => [VehicleEntity], {nullable: true})
  vehicleList: VehicleEntity[]
  @OneToMany(() => BookingEntity, (b) => b.user, {onUpdate: "CASCADE", nullable: true})
  @Field(() => [BookingEntity], {nullable: true})
  bookings: BookingEntity[]
  @Column({ nullable: true})
  @Field(() => Int)
  wallet: number
}
