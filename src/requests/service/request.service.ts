import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { RequestEntity } from "../entity/request.entity";
import { CreateRequestInput } from "../model/create-request.input";
import { from, map, Observable, switchMap, tap } from "rxjs";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../../utils/exceptions/UUIDBadFormat.exception";
import { EmailService } from "src/utils/email/email.service";
import { EmailTypesEnum } from "../../utils/email/enum/email-types.enum";
import { UpdateRequestInput } from "../model/update-request.input";
import { update } from "lodash";
import { RequestStatusEnum, RequestStatusNames } from "../enum/request-status.enum";
import { PageDto, PageOptionsDto, PaginationMeta } from "../../utils/interfaces/pagination.type";
import { ExcelService } from "../../utils/excel/excel.service";
import { RequestParkingTypeNames } from "../enum/request-parking-type.enum";
import { RequestTypeNames } from "../enum/request-type.enum";
import { DateTime } from "luxon";

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestRepository: Repository<RequestEntity>,
    private readonly emailService: EmailService,
    private readonly excelService: ExcelService,
  ) {}
  createRequest(
    createRequestInput: CreateRequestInput
  ): Observable<RequestEntity> {
    const request = this.requestRepository.create(createRequestInput);

    return from(this.requestRepository.save(request)).pipe(
      switchMap((r) => {
        const data = {
          name: request.fullName,
          requestStatus: RequestStatusNames[request.status],
          days: DateTime.now().toFormat('dd/MM/yyyy'),
          hours: DateTime.now().toFormat('HH:mm'),
          formUrl: process.env.WEB_BASE_URL + '/request-parking-details-form?id=' + request.id
        }
        return from(this.emailService.sendEmail(EmailTypesEnum.REQUEST_PARKING_DETAILS_FORM, request.email, JSON.stringify(data))).pipe(
          map(() => r)
        )
      })
    );
  }
  updateRequest(updateRequestInput: UpdateRequestInput): Observable<RequestEntity> {

    if (!uuid.validate(updateRequestInput.id)) {
      throw new UUIDBadFormatException();
    }

    return from(this.requestRepository.preload(updateRequestInput)).pipe(switchMap((request) => {
      if (!request) {
        throw new NotFoundException();
      }
      return from(this.requestRepository.save(request)).pipe(
        tap((r) => {
          switch(updateRequestInput.status) {
            case RequestStatusEnum.PENDING_SEND_FORM:{
              const data = {
                name: request.fullName,
                requestStatus: RequestStatusNames[request.status],
                days: DateTime.now().toFormat('dd/MM/yyyy'),
                hours: DateTime.now().toFormat('HH:mm'),
                formUrl: process.env.WEB_BASE_URL + '/request-parking-details?id=' + request.id
              }
              this.emailService.sendEmail(EmailTypesEnum.REQUEST_PARKING_DETAILS_FORM, request.email, JSON.stringify(data))
              break;
            }
            case RequestStatusEnum.PENDING_SEND_CALENDAR:{
              const data = {
                name: request.fullName,
                requestStatus: RequestStatusNames[request.status],
                days: DateTime.now().toFormat('dd/MM/yyyy'),
                hours: DateTime.now().toFormat('HH:mm'),
                calendarUrl: 'https://calendly.com/parkeate'
              }
              this.emailService.sendEmail(EmailTypesEnum.REQUEST_CALENDAR_FORM, request.email, JSON.stringify(data))
              break;
            }
            case RequestStatusEnum.FINISHED:{
              const data = {
                name: request.fullName,
                requestStatus: RequestStatusNames[request.status],
                days: DateTime.now().toFormat('dd/MM/yyyy'),
                hours: DateTime.now().toFormat('HH:mm'),
              }
              this.emailService.sendEmail(EmailTypesEnum.REQUEST_FINALIZED, request.email, JSON.stringify(data))
              break;
            }
            case RequestStatusEnum.CANCELED:{
              const data = {
                name: request.fullName,
                requestStatus: RequestStatusNames[request.status],
                days: DateTime.now().toFormat('dd/MM/yyyy'),
                hours: DateTime.now().toFormat('HH:mm'),
              }
              this.emailService.sendEmail(EmailTypesEnum.REQUEST_CANCELED, request.email, JSON.stringify(data))
              break;
            }
          }
        })
      )
    }))
  }
  findRequestById(requestId: string): Observable<RequestEntity> {
    if (!uuid.validate(requestId)) {
      throw new UUIDBadFormatException();
    }
    return this.getRequestById(requestId).pipe(
      map((request) => {
        if (!request) {
          throw new NotFoundException();
        }
        return request;
      })
    );
  }
  getRequestById(requestId: string): Observable<RequestEntity | null> {
    return from(
      this.requestRepository.findOne({
        where: {
          id: requestId,
        },
      })
    );
  }
  async findPaginatedRequests(pagination: PageOptionsDto) {
    const query = this.requestRepository
      .createQueryBuilder("r")
      .orderBy("r.createdAt", "DESC")
      .skip(pagination.skip)
      .take(pagination.take);
    const itemCount = await query.getCount();
    const { entities } = await query.getRawAndEntities();
    const pageMetaDto = new PaginationMeta({
      pageOptionsDto: pagination,
      itemCount,
    });
    pageMetaDto.skip = (pageMetaDto.page - 1) * pageMetaDto.take;
    return new PageDto(entities, pageMetaDto);
  }

  async exportRequests(requestsId: string[]) {
    const requests = await this.requestRepository.find(
      {
        where: {
          id: In(requestsId)
        }
      }
    )
    const columns = [
      { header: "Estado Actual", key: "status" },
      { header: "Nombre", key: "fullName" },
      { header: "Telefono", key: "phoneNumber" },
      { header: "Correo", key: "email" },
      { header: "Región", key: "state" },
      { header: "Ciudad", key: "city" },
      { header: "Direccion", key: "address" },
      { header: "Tipo de Estacionamiento", key: "parkingType" },
      { header: "Cantidad", key: "quantity" },
      { header: "Es Propietario", key: "isOwner" },
      { header: "Es Empresa", key: "isCompany" },
    ];
    const data = this.mapRequestsData(requests);
    return await this.excelService.createExcelFromDataArray(
      data,
      columns
    );
  }
  private mapRequestsData(request: RequestEntity[]) {
    return request.map((request) => this.mapRequest(request));
  }
  private mapRequest(request: RequestEntity) {
    return {
      status: RequestStatusNames[request.status],
      fullName: request.fullName,
      phoneNumber: request.phoneNumber,
      email: request.email,
      state: request.state,
      city: request.city,
      address: request.address,
      parkingType: RequestParkingTypeNames[request.parkingType],
      quantity: request.quantity,
      isOwner: request.isOwner,
      isCompany: request.isCompany,
    }
  }
}
