import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LiquidationEntity } from "../entity/liquidation.entity";
import { Repository } from "typeorm";
import { ClientService } from "../../client/service/client.service";
import { BookingService } from "../../booking/service/booking.service";
import * as _ from 'lodash';
import { CronService } from "../../utils/cron/cron.service";
import { Settings } from "luxon";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CronExpressionExtendedEnum } from "../../utils/cron/cron-expression-extended.enum";
import { CreateLiquidationInput } from "../../utils/cron/model/create-liquidation.input";
@Injectable()
export class LiquidationService implements OnModuleInit {
  constructor(
    @InjectRepository(LiquidationEntity)
    private readonly liquidationRepository: Repository<LiquidationEntity>,
    private clientService: ClientService,
    private bookingService: BookingService,
    private cronService: CronService
  ) {

  }
  //BIWEEKLY
  @Cron(CronExpressionExtendedEnum.EVERY_16TH_OF_THE_MONTH_AT_3_AM, {
    name: 'generate16thLiquidations',
  })
  private generate16thLiquidations(): void {

  }
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT, {
    name: 'generate16thLiquidations',
  })
  private generate16thLiquidations(): void {

  }
  onModuleInit(): any {
    Settings.defaultZone = 'America/Sao_Paulo';
    this.generate16thLiquidations()
  }
  async createLiquidation(createLiquidationInput: CreateLiquidationInput, clientId: string, bookingsId: string[]) {
    const liq = this.liquidationRepository.create(createLiquidationInput)
  }
}
