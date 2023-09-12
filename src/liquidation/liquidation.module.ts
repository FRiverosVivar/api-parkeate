import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LiquidationEntity } from "./entity/liquidation.entity";
import { registerEnumType } from "@nestjs/graphql";
import { LiquidationEnum } from "./model/liquidation.enum";
registerEnumType(LiquidationEnum,{
  name: 'LiquidationEnum'
})
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([LiquidationEntity])],
  providers: [],
  exports: [],
})
export class LiquidationModule {}
