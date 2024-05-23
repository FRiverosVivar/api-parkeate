import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RequestEntity } from "../entity/request.entity";
import { CreateRequestInput } from "../model/create-request.input";
import { from, map, Observable, switchMap, tap } from "rxjs";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../../utils/exceptions/UUIDBadFormat.exception";
import { EmailService } from "src/utils/email/email.service";
import { EmailTypesEnum } from "../../utils/email/enum/email-types.enum";
import { UpdateRequestInput } from "../model/update-request.input";
import { update } from "lodash";
import { RequestStatusEnum } from "../enum/request-status.enum";

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestRepository: Repository<RequestEntity>,
    private readonly emailService: EmailService
  ) {}
  createRequest(
    createRequestInput: CreateRequestInput
  ): Observable<RequestEntity> {
    const request = this.requestRepository.create(createRequestInput);

    return from(this.requestRepository.save(request)).pipe(
      tap(() => {
        this.emailService.sendEmail(EmailTypesEnum.REQUEST_CREATED, request.email, JSON.stringify(request))
      })
    );
  }
  updateRequest(updateRequestInput: UpdateRequestInput): Observable<RequestEntity> {
    return from(this.requestRepository.preload(updateRequestInput)).pipe(switchMap((request) => {
      if (!request) {
        throw new NotFoundException();
      }
      return from(this.requestRepository.save(request)).pipe(
        tap(() => {
          switch(updateRequestInput.status) {
            case RequestStatusEnum.PENDING_SEND_CALENDAR:{
              this.emailService.sendEmail(EmailTypesEnum.REQUEST_CALENDAR_FORM, request.email, JSON.stringify(request))
              break;
            }
            case RequestStatusEnum.PENDING_SEND_FORM:{
              this.emailService.sendEmail(EmailTypesEnum.REQUEST_PARKING_DETAILS_FORM, request.email, JSON.stringify(request))
              break;
            }
            case RequestStatusEnum.FINISHED:{
              this.emailService.sendEmail(EmailTypesEnum.REQUEST_CLOSED, request.email, JSON.stringify(request))
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
}
