import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ParkingGuardService } from "./service/parkingGuard.service";
import { EmailService } from "src/utils/email/email.service";
import { CryptService } from "src/utils/crypt/crypt.service";
import { ParkingGuardResolver } from "./resolver/parkingGuard.resolver";
import { ParkingGuardEntity } from "./entity/parkingGuard.entity";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ParkingGuardEntity])],
  providers: [ParkingGuardService, ParkingGuardResolver, EmailService],
  exports: [ParkingGuardResolver, ParkingGuardService],
})
export class ParkingGuardModule {}
