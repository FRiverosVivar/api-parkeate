import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TagsEntity } from "./entity/tags.entity";
import { TagsService } from "./service/tags.service";
import { TagsResolver } from "./resolver/tags.resolver";
import { ParkingService } from "../parking/service/parking.service";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([TagsEntity])],
  providers: [TagsResolver, TagsService],
  exports: [TagsResolver, TagsService]
})
export class TagsModule {}