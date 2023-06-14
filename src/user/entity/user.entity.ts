import {
  Column,
  Entity, ManyToMany, OneToMany
} from "typeorm";
import { Field, ObjectType } from '@nestjs/graphql';
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
  @OneToMany(() => ParkingEntity, (p) => p.userOwner, {onUpdate: "CASCADE"})
  @Field(() => [ParkingEntity])
  parkingList: ParkingEntity[];
  @Column()
  @Field(() => Boolean, { description: 'validated email' })
  validatedEmail: boolean;
  @Column()
  @Field(() => Boolean, { description: 'validated phone' })
  validatedPhone: boolean;
  @ManyToMany(() => ParkingEntity, (p) => p.blockedUsers)
  @Field(() => [ParkingEntity], { description: 'validated phone' })
  restrictedParkings: ParkingEntity[];
  @OneToMany(() => VehicleEntity, (v) => v.owner, {onUpdate: "CASCADE"})
  @Field(() => [VehicleEntity])
  vehicleList: VehicleEntity[]
  @OneToMany(() => BookingEntity, (b) => b.user, {onUpdate: "CASCADE"})
  @Field(() => [BookingEntity])
  bookings: BookingEntity[]
}
