import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LiquidationEntity } from "../entity/liquidation.entity";
import { Repository } from "typeorm";
import { ClientService } from "../../client/service/client.service";
import { BookingService } from "../../booking/service/booking.service";
import { CronService } from "../../utils/cron/cron.service";
import { Settings } from "luxon";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CronExpressionExtendedEnum } from "../../utils/cron/cron-expression-extended.enum";
import { CreateLiquidationInput } from "../../utils/cron/model/create-liquidation.input";
import { LiquidationEnum } from "../model/liquidation.enum";
import * as _ from 'lodash';
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

  @Cron(CronExpressionExtendedEnum.EVERY_16TH_OF_THE_MONTH_AT_3_AM, {
    name: 'generate16thDayLiquidations',
  })
  private async generate16thMonthDayLiquidations(): Promise<void> {
    await this.generateLiquidations()
  }
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT, {
    name: 'generate1stDayLiquidations',
  })
  private async generate1stMonthDayLiquidations(): Promise<void> {
    await this.generateLiquidations()
  }
  async generateLiquidations() {
    const clientsThatHaveUnLiquidatedBookings = await this.clientService.getClientsToLiquidate();
    for(let client of clientsThatHaveUnLiquidatedBookings) {
      switch(client.preferedLiquidationPayRate) {
        case LiquidationEnum.BIWEEKLY15: {
          const bookings = await this.bookingService.getBookingsByClientId(client.id)
          let summarizedPrice = 0;
          _.forEach(bookings,(b) => {
            summarizedPrice += b.finalPrice
          })
          const createLiquidationInput: CreateLiquidationInput = {
            approved: false,
            approvedBy: "",
            liquidationReceipt: "",
            paid: false,
            liquidatedBy: "Parkeate!",
            liquidationType: LiquidationEnum.BIWEEKLY15,
            priceToBeLiquidated: summarizedPrice

          }
          this.createLiquidation()
          break;
        }
        case LiquidationEnum.MONTHLY30: {
          // need to calculate difference days from the previous liquidation
          // const latestLiquidation = await this.findLatestLiquidationFromClientId(client.id)
          // const liquidationCreationDate = DateTime.fromJSDate(latestLiquidation.createdAt)
          break;
        }
        case LiquidationEnum.MONTH_AND_A_HALF45: {

          break;
        }
        case LiquidationEnum.BIMONTHLY60: {

          break;
        }
        case LiquidationEnum.QUARTERLY90: {

          break;
        }
      }
    }


  }
  onModuleInit(): any {
    Settings.defaultZone = 'America/Sao_Paulo';
    this.generate1stMonthDayLiquidations()
    this.generate16thMonthDayLiquidations()
  }
  async createLiquidation(createLiquidationInput: CreateLiquidationInput, clientId: string, bookingsId: string[]) {
    const liq = this.liquidationRepository.create(createLiquidationInput)
  }
  findLatestLiquidationFromClientId(clientId: string) {
    return this.liquidationRepository.findOne({
      relations: {
        client: true
      },
      where: {
        client: {
          id: clientId
        }
      },
      order: {
        createdAt: 'DESC'
      },
    })
  }
}
