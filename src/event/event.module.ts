import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventEntity } from "./entity/event.entity";
import { EventService } from "./service/event.service";
import { EventResolver } from "./resolver/event.resolver";
import { PhotoService } from "src/photo/service/photo.service";
import { PhotoModule } from "src/photo/photo.module";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([EventEntity]), PhotoModule],
  providers: [EventService, EventResolver],
  exports: [EventService, EventResolver],
})
export class EventModule {}
