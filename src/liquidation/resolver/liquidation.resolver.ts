import { Query, Resolver } from "@nestjs/graphql";
import { LiquidationEntity } from "../entity/liquidation.entity";
import { LiquidationService } from "../service/liquidation.service";
import { Observable, from } from "rxjs";

@Resolver(LiquidationEntity)
export class LiquidationResolver {
  constructor(private liquidationService: LiquidationService) {}
  @Query(() => [LiquidationEntity])
  forceToLiquidateToAllBookings():Observable<LiquidationEntity[]> {
    return from(this.liquidationService.generateLiquidations())
  }
}
