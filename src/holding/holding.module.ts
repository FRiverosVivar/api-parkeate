import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HoldingEntity } from "./entity/holding.entity";
import { HoldingService } from "./service/holding.service";
import { HoldingResolver } from "./resolver/holding.resolver";
import { PhotoService } from "../photo/service/photo.service";

@Module({
  imports: [TypeOrmModule.forFeature([HoldingEntity])],
  providers: [HoldingResolver, HoldingService],
  exports: [HoldingResolver, HoldingService],
})
export class HoldingModule {}