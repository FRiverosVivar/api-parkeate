import { ArgsType, Field, InputType } from "@nestjs/graphql";
import { Column, JoinColumn, ManyToOne } from "typeorm";
import { ScheduleDaysEnum } from "../enum/schedule-days.enum";
import { ParkingEntity } from "../../parking/entity/parking.entity";

@InputType()
@ArgsType()
export class CreateScheduleInput {
  @Field(() => ScheduleDaysEnum, { description: 'day of the schedule' })
  day: ScheduleDaysEnum;
  @Field(() => Date)
  scheduleStart: Date;
  @Field(() => Date)
  scheduleEnd: Date;
}