import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LiquidationEntity } from "../entity/liquidation.entity";
import { Repository } from "typeorm";
import { ClientService } from "../../client/service/client.service";
import { BookingService } from "../../booking/service/booking.service";
import { CronService } from "../../utils/cron/cron.service";
import { DateTime, Settings } from "luxon";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CronExpressionExtendedEnum } from "../../utils/cron/cron-expression-extended.enum";
import { CreateLiquidationInput } from "../model/create-liquidation.input";
import * as _ from 'lodash';
import { BookingEntity } from "src/booking/entity/booking.entity";
import { ClientEntity } from "src/client/entity/client.entity";
import { LiquidationEnum } from "../model/liquidation.enum";
import { generateLiquidationTemplateDataToFulfillPdfTemplate, readPdfTemplateFromFilesAndCompileWithData } from '../../utils/utils';
import { FileService } from "src/file/service/file.service";
import { EmailService } from "src/utils/email/email.service";
import { EmailTypesEnum } from "src/utils/email/enum/email-types.enum";
import { UserEntity } from "src/user/entity/user.entity";
import { UserType } from "src/auth/decorator/user-type.decorator";
import { UserTypesEnum } from "src/user/constants/constants";
import { from } from "rxjs";
import { PageDto, PageOptionsDto, PaginationMeta } from "src/utils/interfaces/pagination.type";
@Injectable()
export class LiquidationService implements OnModuleInit {
  constructor(
    @InjectRepository(LiquidationEntity)
    private readonly liquidationRepository: Repository<LiquidationEntity>,
    private clientService: ClientService,
    private bookingService: BookingService,
    private cronService: CronService,
    private fileService: FileService,
    private emailService: EmailService
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
    const liquidations = []
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
            priceToBeLiquidated: summarizedPrice,
            liquidatedPdf: ''
          }
          const liqToSave = this.preCreateLiquidation(createLiquidationInput, client, bookings)
          const savedLiq = await this.saveLiquidation(liqToSave)
          const pdfUrl = await this.generatePdfFileForLiquidation(savedLiq, client)
          savedLiq.liquidatedPdf = pdfUrl;
          const latestSavedLiquidation = await this.saveLiquidation(savedLiq)
          this.sendLiquidationEmailToClientWithPdfAttachment(client, liqToSave)
          liquidations.push(latestSavedLiquidation)

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
    return liquidations
  }
  onModuleInit(): any {
    Settings.defaultZone = 'America/Sao_Paulo';
    // this.generate1stMonthDayLiquidations()
    // this.generate16thMonthDayLiquidations()
  }
  preCreateLiquidation(createLiquidationInput: CreateLiquidationInput, client: ClientEntity, bookings: BookingEntity[]): LiquidationEntity {
    const liq = this.liquidationRepository.create(createLiquidationInput)
    liq.bookings = bookings
    liq.client = client
    return liq;
  }
  async createLiquidation(createLiquidationInput: CreateLiquidationInput, client: ClientEntity, bookings: BookingEntity[]) {
    const liq = this.preCreateLiquidation(createLiquidationInput, client, bookings)
    return this.liquidationRepository.save(liq)
  }
  saveLiquidation(liquidation: LiquidationEntity) {
    return this.liquidationRepository.save(liquidation)
  }
  async generatePdfFileForLiquidation(liquidation: LiquidationEntity, client: ClientEntity): Promise<string> {
    const data = generateLiquidationTemplateDataToFulfillPdfTemplate(liquidation, client)
    const pdf = await readPdfTemplateFromFilesAndCompileWithData(data)
    const date = DateTime.now().toFormat('yyyy-MM-dd')
    return (await this.fileService.uploadPDFBufferToS3(client.id, pdf, `${client.rut}-${date}.pdf`).toPromise())!
  }
  sendLiquidationEmailToClientWithPdfAttachment(client: ClientEntity, liquidation: LiquidationEntity){
    const data = JSON.stringify(this.fillEmailDataWithLiquidationAndClientInfo(client, liquidation))
    this.emailService.sendEmail(EmailTypesEnum.LIQUIDATION_GENERATED, client.email, data)
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
  async findAllLiquidations(pagination: PageOptionsDto, client: ClientEntity) {
    const userType = client.userType;
    let liquidations;
    if(userType >= UserTypesEnum.ADMIN) {
      liquidations = await this.liquidationRepository.find({
        skip: pagination.skip,
        take: pagination.take
      })
    } else {
      liquidations = await this.liquidationRepository.find({
        where: {
          client: {
            id: client.id
          }
        },
        take: 10,
      })
    }
    
    const itemCount = liquidations.length;
    const pageMetaDto = new PaginationMeta({ pageOptionsDto: pagination, itemCount });
    pageMetaDto.skip = (pageMetaDto.page - 1) * pageMetaDto.take;
    return new PageDto(liquidations, pageMetaDto);
  }
  private fillEmailDataWithLiquidationAndClientInfo(client: ClientEntity, liquidation: LiquidationEntity) {
    return {
      name: client.fullname,
      pdfUrl: liquidation.liquidatedPdf
    }
  }
}
