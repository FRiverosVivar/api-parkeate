import { Injectable, NotFoundException } from '@nestjs/common';
import { Equal, In, Not, Repository } from "typeorm";
import { ClientEntity } from '../entity/client.entity';
import { forkJoin, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { EmailTypesEnum } from '../../utils/email/enum/email-types.enum';
import { CreateClientInput } from '../model/create-client.input';
import { EmailService } from '../../utils/email/email.service';
import { SmsService } from '../../utils/sms/sms.service';
import { UpdateClientInput } from '../model/update-client.input';
import * as uuid from 'uuid';
import { UUIDBadFormatException } from '../../utils/exceptions/UUIDBadFormat.exception';
import { getCodeForRegister } from '../../utils/utils';
import { FileUpload } from 'graphql-upload-minimal';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePhotoInput } from "../../photo/model/create-photo.input";
import { PhotoService } from "../../photo/service/photo.service";
import { EmailVerificationCode } from "../model/email-verification-code.response";
import { SmsVerificationCode } from "../model/sms-code.response";

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly photoService: PhotoService,
  ) {}
  async createClient(clientDTO: CreateClientInput): Promise<ClientEntity> {
    const client = this.clientRepository.create(clientDTO);
    client.parkingList = []
    client.buildings = []
    const res = await this.emailService.sendEmail(
      EmailTypesEnum.REGISTER,
      client.email,
      JSON.stringify({ name: client.fullname }),
    )
    return this.clientRepository.save(client)
  }
  updateClient(updatedClient: UpdateClientInput): Observable<ClientEntity> {
    return from(
      this.clientRepository.preload({
        ...updatedClient,
      }),
    ).pipe(
      switchMap((client) => {
        if (!client) {
          throw new NotFoundException();
        }
        return from(this.clientRepository.save(client));
      }),
    );
  }
  removeClient(clientId: string): Observable<ClientEntity> {
    if (!uuid.validate(clientId)) {
      throw new UUIDBadFormatException();
    }
    return from(
      this.clientRepository.findOne({
        where: { id: clientId },
      }),
    ).pipe(
      switchMap((client) => {
        if (!client) {
          throw new NotFoundException();
        }
        return from(this.clientRepository.remove([client])).pipe(
          map((u) => u[0]),
        );
      }),
    );
  }
  findClientsByIds(ids: string[]): Observable<ClientEntity[]> {
    return from(
      this.clientRepository.find({
        where: {
          id: In(ids),
        },
      }),
    );
  }
  getClientEmailCode(email: string, fullname: string): Observable<EmailVerificationCode> {
    const code = getCodeForRegister();
    return from(
      this.emailService.sendEmail(
        EmailTypesEnum.CODE,
        email,
        JSON.stringify({name: fullname, code: code }),
      )).pipe(
      switchMap((() => {
        return of({code: code} as EmailVerificationCode)
      }))
    );
  }
  getClientSMSCode(phoneNumber: string): Observable<SmsVerificationCode> {
    const code = getCodeForRegister();
    return this.smsService.publishSMSToPhoneNumber(phoneNumber, code).pipe(
      switchMap((u) => {
        const response = { smsCode: code } as SmsVerificationCode;
        return of(response);
      })
    )
  }
  findClientById(clientId: string): Observable<ClientEntity> {
    if (!uuid.validate(clientId)) {
      throw new UUIDBadFormatException();
    }

    return from(
      this.clientRepository.findBy({
        id: Equal(clientId),
      }),
    )
      .pipe(map((clients) => clients[0]))
      .pipe(
        map((client) => {
          if (!client) {
            throw new NotFoundException();
          }
          return client;
        }),
      );
  }
  findClientByRut(rut: string): Observable<ClientEntity> {
    return this.getClientByRut(rut).pipe(
      map((client) => {
        if (!client) {
          throw new NotFoundException();
        }
        return client;
      }),
    );
  }
  getClientByRut(rut: string): Observable<ClientEntity | null> {
    return from(
      this.clientRepository.findOne({
        where: {
          rut: rut,
        },
      }),
    );
  }
  getClientsToLiquidate() {
    return this.clientRepository.createQueryBuilder('c')
      .leftJoin(`c.buildings`, 'b')
      .leftJoin(`b.parkingList`, 'p')
      .leftJoin(`p.bookings`, 'bk')
      .select(`c.id`)
      .where(`bk.id is not null`)
      .andWhere(`bk.liquidationId is null`)
      .getMany()
  }
  findAll(): Observable<ClientEntity[]> {
    return from(this.clientRepository.find());
  }
  setProfilePhoto(clientId: string, file: FileUpload, photoInput: CreatePhotoInput): Observable<ClientEntity> {
    return this.findClientById(clientId).pipe(
      switchMap((client: ClientEntity) => {
        return this.photoService.createPhoto(photoInput, file).pipe(
          switchMap((photo) => {
            if (client.profilePhoto)
              this.photoService.removePhoto(client.profilePhoto);

            client.profilePhoto = photo.url;
            return from(this.clientRepository.save(client));
          }),
        );
      }),
    );
  }
}
