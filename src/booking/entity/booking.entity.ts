import { Field, ObjectType } from "@nestjs/graphql";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";
import { BookingTypesEnum } from "../enum/booking-types.enum";
import { BookingStatesEnum } from "../enum/booking-states.enum";
import { ParkingEntity } from "../../parking/entity/parking.entity";
import { UserEntity } from "../../user/entity/user.entity";

@Entity('booking')
@ObjectType()
export class BookingEntity extends BaseEntityWithIdAbstract {
  @Column()
  @Field(() => BookingTypesEnum)
  bookingType: BookingTypesEnum
  @Column()
  @Field(() => BookingStatesEnum)
  bookingState: BookingStatesEnum
  @ManyToOne(() => ParkingEntity, (p) => p.bookings, {eager: true}  )
  @Field(() => ParkingEntity)
  parking: ParkingEntity
  @ManyToOne(() => UserEntity, (p) => p.bookings, {eager: true}  )
  @Field(() => UserEntity)
  user: UserEntity
  @Column()
  @Field(() => Number)
  initialPrice: number
  @Column({type: 'timestamptz', nullable: true})
  @Field(() => Date)
  dateStart: Date
  @Column({type: 'timestamptz', nullable: true})
  @Field(() => Date)
  dateEnd: Date
  @Column({type: 'timestamptz', nullable: true})
  @Field(() => Date, {nullable: true})
  dateExtended: Date
  @Column({type: 'timestamptz', nullable: true})
  @Field(() => Date, {nullable: true})
  timeFinalized: Date
  @Column({nullable: true})
  @Field(() => Number,{nullable: true})
  finalPrice: number
}
