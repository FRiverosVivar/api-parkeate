import { Controller, Get } from "@nestjs/common";
import { LiquidationService } from "../service/liquidation.service";

@Controller("/liquidation/force")
export class LiquidationController {
  constructor(private readonly liquidationService: LiquidationService) {}

  @Get()
  forceToLiquidate() {
    return this.liquidationService.generateLiquidations();
  }
}
