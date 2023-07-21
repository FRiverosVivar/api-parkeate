import { Column, Entity } from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";
import { BookingStatesEnum } from "../../../booking/enum/booking-states.enum";
import { BaseEntityWithIdAbstract } from "../../interfaces/base-entity-with-id.abstract";

@Entity('cron')
@ObjectType()
export class CronEntity extends BaseEntityWithIdAbstract {
  @Column({type: 'timestamptz'})
  @Field(() => Date)
  dateStart: Date
  @Column({type: 'timestamptz'})
  @Field(() => Date)
  dateEnd: Date
  @Column()
  @Field(() => String)
  bookingId: string
  @Column()
  @Field(() => Int)
  stateWhenEnd: BookingStatesEnum
  @Column()
  @Field(() => Boolean)
  executed: boolean
}
