import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { ScheduleEntity } from "../entity/schedule.entity";
import { ScheduleService } from "../service/schedule.service";
import { BuildingEntity } from "../../building/entity/building.entity";
import { CreateScheduleInput } from "../model/create-schedule.input";
import { UpdateScheduleInput } from "../model/update-schedule.input";
import { Observable } from "rxjs";

@Resolver(ScheduleEntity)
export class ScheduleResolver {
  constructor(private scheduleService: ScheduleService) {}
  @Mutation(() => ScheduleEntity)
  createSchedule(
    @Args("createScheduleInput") createScheduleInput: CreateScheduleInput,
    @Args("parkingId") parkingId: string
  ): Observable<ScheduleEntity> {
    return this.scheduleService.createSchedule(createScheduleInput, parkingId);
  }
  @Mutation(() => ScheduleEntity)
  removeSchedule(
    @Args("scheduleId") scheduleId: string
  ): Observable<ScheduleEntity> {
    return this.scheduleService.removeSchedule(scheduleId);
  }
  @Mutation(() => ScheduleEntity)
  updateSchedule(
    @Args("updateScheduleInput") updateScheduleInput: UpdateScheduleInput
  ) {
    return this.scheduleService.updateSchedule(updateScheduleInput);
  }
}
