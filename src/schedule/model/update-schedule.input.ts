import { ArgsType, Field, InputType, PartialType } from "@nestjs/graphql";
import { CreateScheduleInput } from "./create-schedule.input";
import { Column } from "typeorm";

@InputType()
@ArgsType()
export class UpdateScheduleInput extends PartialType(CreateScheduleInput) {
  @Column()
  @Field(() => String)
  id: string;
}