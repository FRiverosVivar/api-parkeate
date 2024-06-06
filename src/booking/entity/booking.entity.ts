import { Field, Int, ObjectType } from "@nestjs/graphql";
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  getManager,
} from "typeorm";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";
import { BookingTypesEnum } from "../enum/booking-types.enum";
import { BookingStatesEnum } from "../enum/booking-states.enum";
import { ParkingEntity } from "../../parking/entity/parking.entity";
import { UserEntity } from "../../user/entity/user.entity";
import { LiquidationEntity } from "../../liquidation/entity/liquidation.entity";
import { DateTime } from "luxon";
import { VehicleEntity } from "src/vehicle/entity/vehicle.entity";
import { InAdvanceBooking } from "../enum/in-advance-booking.enum";
import { UserCouponEntity } from "src/coupons/user-coupons/entity/user-coupons.entity";

@Entity("booking")
@ObjectType()
export class BookingEntity extends BaseEntityWithIdAbstract {
  @Column()
  @Field(() => String)
  numberId: string;
  @Column()
  @Field(() => Int)
  bookingType: BookingTypesEnum;
  @Column()
  @Field(() => Int)
  bookingState: BookingStatesEnum;
  @ManyToOne(() => ParkingEntity, (p) => p.bookings, { eager: true })
  @Field(() => ParkingEntity)
  parking: ParkingEntity;
  @ManyToOne(() => UserEntity, (p) => p.bookings, { eager: true })
  @Field(() => UserEntity)
  user: UserEntity;
  @Column()
  @Field(() => Number)
  initialPrice: number;
  @Column({ type: "timestamptz", nullable: true })
  @Field(() => Date)
  dateStart: Date;
  @Column({ type: "timestamptz", nullable: true })
  @Field(() => Date)
  dateEnd: Date;
  @Column({ type: "timestamptz", nullable: true })
  @Field(() => Date, { nullable: true })
  dateExtended: Date;
  @Column({ type: "timestamptz", nullable: true })
  @Field(() => Date, { nullable: true })
  timeFinalized: Date;
  @Column({ nullable: true })
  @Field(() => Number, { nullable: true })
  finalPrice: number;
  @Column({ nullable: true })
  @Field(() => Boolean)
  paid: boolean;
  @ManyToOne(() => LiquidationEntity, (l) => l.bookings, { nullable: true })
  @Field(() => LiquidationEntity)
  liquidation: LiquidationEntity;
  @ManyToOne(() => VehicleEntity, (v) => v.bookings, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @Field(() => VehicleEntity, { nullable: true })
  vehicle: VehicleEntity;
  @Column({ nullable: true })
  @Field(() => Boolean, { nullable: true })
  anticipatedBooking: boolean;
  @Column({ nullable: true })
  @Field(() => Boolean, { nullable: true })
  lastestNotifiedState: InAdvanceBooking;
}
