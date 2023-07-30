import { Injectable, NotFoundException } from '@nestjs/common';
import { Equal, In, Repository } from "typeorm";
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
import { ClientWithVerificationCode } from '../model/client-with-verification-code.response';
import { ClientWithSmsCode } from '../model/client-with-sms-code.response';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePhotoInput } from "../../photo/model/create-photo.input";
import { PhotoService } from "../../photo/service/photo.service";

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly photoService: PhotoService,
  ) {}
  createClient(clientDTO: CreateClientInput): Observable<ClientEntity> {
    const client = this.clientRepository.create(clientDTO);
    client.parkingList = []
    client.buildings = []
    const emailSubject = from(
      this.emailService.sendEmail(
        EmailTypesEnum.REGISTER,
        'no-reply@parkeateapp.com',
        JSON.stringify({ name: client.fullname }),
      ),
    );
    const saveUserSubject = from(this.clientRepository.save(client));
    return forkJoin([emailSubject, saveUserSubject]).pipe(
      map(([value, c]) => {
        return c;
      }),
    );
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
  getUserEmailCode(id: string): Observable<ClientWithVerificationCode> {
    const code = getCodeForRegister();
    return this.findClientById(id).pipe(
      tap((u) => {
        from(
          this.emailService.sendEmail(
            EmailTypesEnum.CODE,
            'no-reply@parkeateapp.com',
            JSON.stringify({ code: code }),
          ),
        );
      }),
      switchMap((u) => {
        const response = {
          client: u,
          code: code,
        } as ClientWithVerificationCode;
        return of(response);
      }),
    );
  }
  getUserSMSCode(id: string): Observable<ClientWithSmsCode> {
    const code = getCodeForRegister();
    return this.findClientById(id).pipe(
      tap((u) => {
        this.smsService.publishSMSToPhoneNumber(u.phoneNumber, code);
      }),
      switchMap((u) => {
        const response = { client: u, smsCode: code } as ClientWithSmsCode;
        return of(response);
      }),
    );
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
