import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ParkingEntity } from "./entity/parking.entity";
import { ParkingResolver } from "./resolver/parking.resolver";
import { ParkingService } from "./service/parking.service";
import { registerEnumType } from "@nestjs/graphql";
import { ParkingType } from "./model/parking-type.enum";
registerEnumType(ParkingType, {
  name: 'ParkingType',
});
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ParkingEntity])],
  providers: [ParkingResolver, ParkingService],
  exports: [ParkingResolver,ParkingService],
})
export class ParkingModule {}
