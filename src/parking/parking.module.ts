import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ParkingEntity } from "./entity/parking.entity";
import { ParkingResolver } from "./resolver/parking.resolver";
import { ParkingService } from "./service/parking.service";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ParkingEntity])],
  providers: [ParkingResolver, ParkingService],
  exports: [ParkingResolver,ParkingService],
})
export class ParkingModule {}