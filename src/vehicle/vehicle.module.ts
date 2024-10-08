import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VehicleEntity } from "./entity/vehicle.entity";
import { VehicleService } from "./service/vehicle.service";
import { VehicleResolver } from "./resolver/vehicle.resolver";
import { EmailService } from "../utils/email/email.service";
import { registerEnumType } from "@nestjs/graphql";
import { VehicleTypeEnum } from "./model/vehicle-type.enum";

registerEnumType(VehicleTypeEnum, {
  name: "VehicleTypeEnum",
});
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([VehicleEntity])],
  providers: [VehicleResolver, VehicleService, EmailService],
  exports: [VehicleResolver, VehicleService],
})
export class VehicleModule {}
