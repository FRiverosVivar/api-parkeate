import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Field, ObjectType } from "@nestjs/graphql";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";
import { ScheduleDaysEnum } from "../enum/schedule-days.enum";
import { ParkingEntity } from "../../parking/entity/parking.entity";

@Entity('schedule')
@ObjectType()
export class ScheduleEntity extends BaseEntityWithIdAbstract {
  @Column({ type: 'enum', enum: ScheduleDaysEnum })
  @Field(() => ScheduleDaysEnum, { description: 'day of the schedule' })
  day: ScheduleDaysEnum;
  @Column({type: 'timestamptz'})
  @Field(() => Date)
  scheduleStart: Date;
  @Column({type: 'timestamptz'})
  @Field(() => Date)
  scheduleEnd: Date;
  @ManyToOne(() => ParkingEntity, (p) => p.schedule, {eager: true})
  @JoinColumn([
    { name: "parkingId", referencedColumnName: "id" }]
  )
  @Field(() => ParkingEntity)
  parking: ParkingEntity
}