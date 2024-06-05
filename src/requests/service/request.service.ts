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
import { RequestStatusEnum, RequestStatusNames } from "../enum/request-status.enum";
import { PageDto, PageOptionsDto, PaginationMeta } from "../../utils/interfaces/pagination.type";
import { ExcelService } from "../../utils/excel/excel.service";
import { RequestParkingTypeNames } from "../enum/request-parking-type.enum";
import { DateTime } from "luxon";
import { FileUpload } from "graphql-upload-minimal";
import { CreatePhotoInput } from "../../photo/model/create-photo.input";
import { ClientEntity } from "../../client/entity/client.entity";
import { PhotoService } from "../../photo/service/photo.service";

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestRepository: Repository<RequestEntity>,
    private readonly emailService: EmailService,
    private readonly excelService: ExcelService,
    private readonly photoService: PhotoService
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
        }
        return from(this.emailService.sendEmail(EmailTypesEnum.REQUEST_CREATED, request.email, JSON.stringify(data))).pipe(
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
            case RequestStatusEnum.PENDING:{
              const data = {
                name: request.fullName,
                requestStatus: RequestStatusNames[request.status],
                days: DateTime.now().toFormat('dd/MM/yyyy'),
                hours: DateTime.now().toFormat('HH:mm'),
              }
              this.emailService.sendEmail(EmailTypesEnum.REQUEST_CREATED, request.email, JSON.stringify(data))
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
  async findPaginatedRequests(pagination: PageOptionsDto, statusFilters: RequestStatusEnum[]) {
    const request = await this.requestRepository.find({
      where: {
        status: statusFilters && statusFilters.length > 0 ? In(statusFilters): In([RequestStatusEnum.PENDING, RequestStatusEnum.FINISHED, RequestStatusEnum.CANCELED]),
      },
      order: {
        createdAt: "DESC"
      },
      skip: pagination.skip,
      take: pagination.take
    })
    const itemCount = request.length
    const pageMetaDto = new PaginationMeta({
      pageOptionsDto: pagination,
      itemCount,
    });
    pageMetaDto.skip = (pageMetaDto.page - 1) * pageMetaDto.take;
    return new PageDto(request, pageMetaDto);
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
  setRequestPhoto(
    requestId: string,
    file: FileUpload,
    photoInput: CreatePhotoInput
  ): Observable<RequestEntity> {
    return this.findRequestById(requestId).pipe(
      switchMap((req: RequestEntity) => {
        return this.photoService.createPhoto(photoInput, file).pipe(
          switchMap((photo) => {
            if (req.parkingPhoto)
              this.photoService.removePhoto(req.parkingPhoto);

            req.parkingPhoto = photo.url;
            return from(this.requestRepository.save(req));
          })
        );
      })
    );
  }
}
