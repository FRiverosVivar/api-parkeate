import { Injectable, NotFoundException } from "@nestjs/common";
import { Equal, ILike, In, Not, Repository } from "typeorm";
import { ClientEntity } from "../entity/client.entity";
import { forkJoin, from, map, Observable, of, switchMap, tap } from "rxjs";
import { EmailTypesEnum } from "../../utils/email/enum/email-types.enum";
import { CreateClientInput } from "../model/create-client.input";
import { EmailService } from "../../utils/email/email.service";
import { SmsService } from "../../utils/sms/sms.service";
import { UpdateClientInput } from "../model/update-client.input";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../../utils/exceptions/UUIDBadFormat.exception";
import { getCodeForRegister } from "../../utils/utils";
import { FileUpload } from "graphql-upload-minimal";
import { InjectRepository } from "@nestjs/typeorm";
import { CreatePhotoInput } from "../../photo/model/create-photo.input";
import { PhotoService } from "../../photo/service/photo.service";
import { EmailVerificationCode } from "../model/email-verification-code.response";
import { SmsVerificationCode } from "../model/sms-code.response";
import { RecoverPasswordCodeAndClientId } from "../model/recover-password.response";
import { CryptService } from "src/utils/crypt/crypt.service";
import { ExcelService } from "src/utils/excel/excel.service";
import * as _ from "lodash";
import {
  UserTypesEnum,
  UserTypesEnumNames,
} from "src/user/constants/constants";
import {
  PageDto,
  PageOptionsDto,
  PaginationMeta,
} from "src/utils/interfaces/pagination.type";
import { RequestStatusEnum } from "../../requests/enum/request-status.enum";

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly photoService: PhotoService,
    private readonly cryptService: CryptService,
    private readonly excelService: ExcelService
  ) {}
  async createClient(clientDTO: CreateClientInput): Promise<ClientEntity> {
    const client = this.clientRepository.create(clientDTO);
    client.parkingList = [];
    client.buildings = [];
    const res = await this.emailService.sendEmail(
      EmailTypesEnum.REGISTER,
      client.email,
      JSON.stringify({ name: client.fullname })
    );
    return this.clientRepository.save(client);
  }
  updateClient(updatedClient: UpdateClientInput): Observable<ClientEntity> {
    return from(
      this.clientRepository.preload({
        ...updatedClient,
      })
    ).pipe(
      switchMap((client) => {
        if (!client) {
          throw new NotFoundException();
        }
        if (updatedClient.password) {
          return this.cryptService.hash(updatedClient.password).pipe(
            switchMap((pw: string) => {
              client.password = pw;
              return from(this.clientRepository.save(client));
            })
          );
        }
        return from(this.clientRepository.save(client));
      })
    );
  }
  removeClient(clientId: string): Observable<ClientEntity> {
    if (!uuid.validate(clientId)) {
      throw new UUIDBadFormatException();
    }
    return from(
      this.clientRepository.findOne({
        where: { id: clientId },
      })
    ).pipe(
      switchMap((client) => {
        if (!client) {
          throw new NotFoundException();
        }
        return from(this.clientRepository.remove([client])).pipe(
          map((u) => u[0])
        );
      })
    );
  }
  findClientsByIds(ids: string[]): Observable<ClientEntity[]> {
    return from(
      this.clientRepository.find({
        where: {
          id: In(ids),
        },
      })
    );
  }
  getClientEmailCode(
    email: string,
    fullname: string
  ): Observable<EmailVerificationCode> {
    const code = getCodeForRegister();
    return from(
      this.emailService.sendEmail(
        EmailTypesEnum.CODE,
        email,
        JSON.stringify({ name: fullname, code: code })
      )
    ).pipe(
      switchMap(() => {
        return of({ code: code } as EmailVerificationCode);
      })
    );
  }
  getClientSMSCode(phoneNumber: string): Observable<SmsVerificationCode> {
    const code = getCodeForRegister();
    return this.smsService.publishSMSToPhoneNumber(phoneNumber, code).pipe(
      switchMap((u) => {
        const response = { smsCode: code } as SmsVerificationCode;
        return of(response);
      })
    );
  }
  searchClientByRutEmailOrPhone(
    rut: string,
    email: string,
    phone: string
  ): Promise<ClientEntity | null> {
    return this.clientRepository.findOne({
      where: [
        { rut: Equal(rut) },
        { email: Equal(email) },
        { phoneNumber: Equal(phone) },
      ],
    });
  }
  findClientById(clientId: string): Observable<ClientEntity> {
    if (!uuid.validate(clientId)) {
      throw new UUIDBadFormatException();
    }

    return from(
      this.clientRepository.findBy({
        id: Equal(clientId),
      })
    )
      .pipe(map((clients) => clients[0]))
      .pipe(
        map((client) => {
          if (!client) {
            throw new NotFoundException();
          }
          return client;
        })
      );
  }
  findClientByRut(rut: string): Observable<ClientEntity> {
    return this.getClientByRut(rut).pipe(
      map((client) => {
        if (!client) {
          throw new NotFoundException();
        }
        return client;
      })
    );
  }
  getClientByRut(rut: string): Observable<ClientEntity | null> {
    return from(
      this.clientRepository.findOne({
        where: {
          rut: rut,
        },
      })
    );
  }
  getClientsToLiquidate() {
    return this.clientRepository.query(
      `select c.* from client as c
      left join parking as p 
      on p."clientId"  = c.id
      left join booking as bk
      on p.id = bk."parkingId"
      where bk.id is not null
      and bk."liquidationId" is null
      group by c.id`
    );
    // return this.clientRepository
    //   .createQueryBuilder("c")
    //   .leftJoin(`c.buildings`, "b")
    //   .leftJoin(`b.parkingList`, "p")
    //   .leftJoin(`p.bookings`, "bk")
    //   .where(`bk.id is not null`)
    //   .andWhere(`bk.liquidationId is null`)
    //   .getMany();
  }
  // async getPaginatedGuardsFromBuilding(
  //   buildingId: string,
  //   pagination: PageOptionsDto
  // ) {
  //   const clients = await this.clientRepository.find({
  //     where: {
  //       guardBuildings: {
  //         id: Equal(buildingId),
  //       },
  //     },
  //     skip: pagination.skip,
  //     take: pagination.take,
  //     order: {
  //       createdAt: "DESC",
  //     },
  //   });
  //   const itemCount = clients.length;
  //   const pageMetaDto = new PaginationMeta({
  //     pageOptionsDto: pagination,
  //     itemCount,
  //   });
  //   pageMetaDto.skip = (pageMetaDto.page - 1) * pageMetaDto.take;
  //   return new PageDto(clients, pageMetaDto);
  // }
  findAll(): Observable<ClientEntity[]> {
    return from(this.clientRepository.find());
  }
  checkClientAndGetCodeToValidate(rut: string) {
    return this.findClientByRut(rut).pipe(
      switchMap((c) => {
        return this.getClientEmailCode(c.email, c.fullname).pipe(
          map((e) => {
            const recoverPassword: RecoverPasswordCodeAndClientId = {
              id: c.id,
              code: e.code,
            };
            return recoverPassword;
          })
        );
      })
    );
  }
  setProfilePhoto(
    clientId: string,
    file: FileUpload,
    photoInput: CreatePhotoInput
  ): Observable<ClientEntity> {
    return this.findClientById(clientId).pipe(
      switchMap((client: ClientEntity) => {
        return this.photoService.createPhoto(photoInput, file).pipe(
          switchMap((photo) => {
            if (client.profilePhoto)
              this.photoService.removePhoto(client.profilePhoto);

            client.profilePhoto = photo.url;
            return from(this.clientRepository.save(client));
          })
        );
      })
    );
  }
  async exportClients() {
    const columns = [
      { header: "Id", key: "id" },
      { header: "Nombre Completo", key: "fullname" },
      { header: "Email", key: "email" },
      { header: "Telefono", key: "phoneNumber" },
      { header: "Tipo de Usuario", key: "userType" },
    ];
    const clients = await this.clientRepository.find();
    const data = this.mapClientsToExcelData(clients);
    const worksheet = await this.excelService.createExcelFromDataArray(
      data,
      columns
    );
    return worksheet;
  }
  mapClientsToExcelData(clients: ClientEntity[]) {
    const dataClients: Array<{
      id: string;
      fullname: string;
      email: string;
      phoneNumber: string;
      userType: string;
    }> = [];
    _.forEach(clients, (c) => {
      const client: {
        id: string;
        fullname: string;
        email: string;
        phoneNumber: string;
        userType: string;
      } = c as unknown as {
        id: string;
        fullname: string;
        email: string;
        phoneNumber: string;
        userType: string;
      };
      client.userType = UserTypesEnumNames[c.userType];
      dataClients.push(client);
    });
    return dataClients;
  }

  async findPaginatedClients(pagination: PageOptionsDto, text: string) {
    const whereQuery = text ? `LOWER(c.fullname) like '%${text.toLowerCase()}%'or c."phoneNumber" like %${text}% or LOWER(c.email) like '%${text
      .toLowerCase()
      .replace(
        "-",
        ""
      )}%' or translate(c.rut, '-', '') like '%${text.toLowerCase()}%' or c.rut like '%${text.toLowerCase()}%'`: ``
    const query = this.clientRepository
      .createQueryBuilder("c")
      .where(whereQuery)
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
}
