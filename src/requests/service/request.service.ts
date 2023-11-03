import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RequestEntity } from "../entity/request.entity";
import { CreateRequestInput } from "../model/create-request.input";
import { from, map, Observable, switchMap, tap } from "rxjs";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../../utils/exceptions/UUIDBadFormat.exception";
import { EmailService } from "src/utils/email/email.service";

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
        this.emailService.sendRawEmail(
          request.email,
          "CORREO GENERADO POR HOME PAGE | " + request.content,
          request.subject
        );
      })
    );
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
