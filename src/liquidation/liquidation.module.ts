import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LiquidationEntity } from "./entity/liquidation.entity";
import { registerEnumType } from "@nestjs/graphql";
import { LiquidationEnum } from "./model/liquidation.enum";
import { LiquidationService } from "./service/liquidation.service";
import { LiquidationResolver } from "./resolver/liquidation.resolver";
import { EmailService } from "src/utils/email/email.service";
import { LiquidationController } from "./controller/liquidation.controller";
import { LiquidationSubscriber } from "./subscriber/liquidation.subscriber";
import { DataSourceOptions } from "typeorm";
registerEnumType(LiquidationEnum,{
  name: 'LiquidationEnum'
})
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([LiquidationEntity])],
  providers: [LiquidationService, LiquidationResolver, EmailService],
  controllers: [LiquidationController],
  exports: [LiquidationService, LiquidationResolver],
})
export class LiquidationModule {}
