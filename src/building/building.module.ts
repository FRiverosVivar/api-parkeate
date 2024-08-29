import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BuildingEntity } from "./entity/building.entity";
import { BuildingService } from "./service/building.service";
import { BuildingResolver } from "./resolver/building.resolver";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([BuildingEntity])],
  providers: [BuildingResolver, BuildingService],
  exports: [BuildingResolver, BuildingService],
})
export class BuildingModule {}
