import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CronService } from "./cron.service";
import { CronEntity } from "./entity/cron.entity";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([CronEntity])],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}
