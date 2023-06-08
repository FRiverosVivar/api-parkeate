import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PhotoEntity } from "../photo/entity/photo.entity";
import { PhotoService } from "../photo/service/photo.service";
import { ParkingEntity } from "./entity/parking.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ParkingEntity])],
  providers: [],
  exports: [],
})
export class ParkingModule {}