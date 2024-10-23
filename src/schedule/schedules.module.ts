import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleEntity } from "./entity/schedule.entity";
import { ScheduleService } from "./service/schedule.service";
import { registerEnumType } from "@nestjs/graphql";
import { ScheduleDaysEnum } from "./enum/schedule-days.enum";
import { ScheduleResolver } from "./resolver/schedule.resolver";
registerEnumType(ScheduleDaysEnum, {
  name: "ScheduleDaysEnum",
});
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ScheduleEntity])],
  providers: [ScheduleService, ScheduleResolver],
  exports: [ScheduleService, ScheduleResolver],
})
export class SchedulesModule {}
