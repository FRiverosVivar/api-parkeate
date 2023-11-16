import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, Equal, Like, Repository } from "typeorm";
import { UserEntity } from "../entity/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import {
  concatMap,
  filter,
  forkJoin,
  from,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from "rxjs";
import { UpdateUserInput } from "../model/dto/update-user.input";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../../utils/exceptions/UUIDBadFormat.exception";
import { CreateUserInput } from "../model/dto/create-user.input";
import { FileUpload } from "graphql-upload-minimal";
import { EmailService } from "../../utils/email/email.service";
import { EmailTypesEnum } from "../../utils/email/enum/email-types.enum";
import { SmsService } from "../../utils/sms/sms.service";
import { getCodeForRegister } from "../../utils/utils";
import { ExistingRutException } from "../../utils/exceptions/ExistingRut.exception";
import { PhotoService } from "../../photo/service/photo.service";
import { CreatePhotoInput } from "../../photo/model/create-photo.input";
import { EmailVerificationCode } from "../../client/model/email-verification-code.response";
import { SmsVerificationCode } from "../../client/model/sms-code.response";
import {
  PageDto,
  PageOptionsDto,
  PaginationMeta,
} from "../../utils/interfaces/pagination.type";
import { ClientEntity } from "../../client/entity/client.entity";
import { UserTypesEnum } from "../constants/constants";
import { HttpService } from "@nestjs/axios";
import { CryptService } from "src/utils/crypt/crypt.service";
import { PaykuCreateClientInput } from "src/utils/interfaces/payku-create-client.input";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private emailService: EmailService,
    private smsService: SmsService,
    private photoService: PhotoService,
    private httpService: HttpService,
    private readonly crypto: CryptService
  ) {}
  createUser(userDTO: CreateUserInput): Observable<UserEntity> {
    userDTO.wallet = 0;
    const user = this.userRepository.create(userDTO);
    const emailSubject = from(
      this.emailService.sendEmail(
        EmailTypesEnum.REGISTER,
        user.email,
        JSON.stringify({ name: user.fullname })
      )
    );

    const saveUserSubject = from(this.userRepository.save(user));
    return this.getUserByRut(user.rut).pipe(
      switchMap((user) => {
        if (user) throw new ExistingRutException();

        return forkJoin([emailSubject, saveUserSubject]).pipe(
          map(([value, user]) => {
            return user;
          })
        );
      })
    );
  }
  updateUser(updatedUser: UpdateUserInput): Observable<UserEntity> {
    return from(
      this.userRepository.preload({
        ...updatedUser,
      })
    ).pipe(
      switchMap((user) => {
        if (!user) {
          throw new NotFoundException();
        }
        return from(this.userRepository.save(user));
      })
    );
  }
  removeUser(userId: string): Observable<UserEntity> {
    if (!uuid.validate(userId)) {
      throw new UUIDBadFormatException();
    }
    return from(this.findUserById(userId)).pipe(
      switchMap((user) => {
        return from(this.userRepository.remove([user])).pipe(map((u) => u[0]));
      })
    );
  }
  getUserEmailCode(
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
  getUserSMSCode(phoneNumber: string): Observable<SmsVerificationCode> {
    const code = getCodeForRegister();
    return this.smsService.publishSMSToPhoneNumber(phoneNumber, code).pipe(
      switchMap((u) => {
        const response = { smsCode: code } as SmsVerificationCode;
        return of(response);
      })
    );
  }
  findUserById(userId: string): Observable<UserEntity> {
    if (!uuid.validate(userId)) {
      throw new UUIDBadFormatException();
    }

    return from(
      this.userRepository.findOne({
        relations: {
          userCoupons: {
            coupon: true,
          },
        },
        where: {
          id: Equal(userId),
        },
      })
    ).pipe(
      map((user) => {
        if (!user) {
          throw new NotFoundException();
        }
        return user;
      })
    );
  }
  findUserByRut(rut: string): Observable<UserEntity> {
    return this.getUserByRut(rut).pipe(
      map((user) => {
        if (!user) {
          throw new NotFoundException();
        }
        return user;
      })
    );
  }
  getUserByRut(rut: string): Observable<UserEntity | null> {
    return from(
      this.userRepository.findOne({
        relations: {
          userCoupons: {
            coupon: true,
          },
        },
        where: {
          rut: rut,
        },
      })
    );
  }
  findAll(): Observable<UserEntity[]> {
    return from(this.userRepository.find());
  }
  setProfilePhoto(
    userId: string,
    file: FileUpload,
    photoInput: CreatePhotoInput
  ): Observable<UserEntity> {
    return this.findUserById(userId).pipe(
      switchMap((user: UserEntity) => {
        return this.photoService.createPhoto(photoInput, file).pipe(
          switchMap((photo) => {
            if (user.profilePhoto)
              this.photoService.removePhoto(user.profilePhoto);

            user.profilePhoto = photo.url;
            return from(this.userRepository.save(user));
          })
        );
      })
    );
  }
  async findPaginatedBlockedUsersOfParking(
    pagination: PageOptionsDto,
    user: ClientEntity,
    parkingId?: string
  ) {
    const query = this.userRepository
      .createQueryBuilder("u")
      .leftJoinAndSelect("u.restrictedParkings", "rp")
      .where(
        user.userType < UserTypesEnum.ADMIN ? `c.id = '${user.id}'::uuid` : ""
      )
      .andWhere(parkingId ? `rp.id = '${parkingId}'::uuid` : "")
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
  searchUsersByGivenRutEmailOrFullname(text: string, ids: string[]) {
    const query = this.userRepository
      .createQueryBuilder("u")
      .where(
        `LOWER(u.fullname) like '%${text.toLowerCase()}%' or LOWER(u.email) like '%${text
          .toLowerCase()
          .replace(
            "-",
            ""
          )}%' or translate(u.rut, '-', '') like '%${text.toLowerCase()}%' or u.rut like '%${text.toLowerCase()}%'`
      );
    return from(query.getMany()).pipe(
      map((users) => users.filter((user) => !ids.includes(user.id)))
    );
  }
  async findPaginatedAssignedUsersOfCoupon(
    pagination: PageOptionsDto,
    couponId: string
  ) {
    const users = await this.userRepository.find({
      relations: {
        userCoupons: {
          coupon: true,
        },
      },
      where: {
        userCoupons: {
          coupon: {
            id: couponId,
          },
        },
      },
      skip: pagination.skip,
      take: pagination.take,
    });

    const itemCount = users.length;
    const pageMetaDto = new PaginationMeta({
      pageOptionsDto: pagination,
      itemCount,
    });
    pageMetaDto.skip = (pageMetaDto.page - 1) * pageMetaDto.take;
    return new PageDto(users, pageMetaDto);
  }
  async removeAssignedUserFromCoupon(userId: string, couponId: string) {
    const user = (await this.findUserById(userId).toPromise())!;
    const assignedCoupons = user.userCoupons;
    const remainingCoupons = assignedCoupons.filter((c) => c.id !== couponId);
    user.userCoupons = remainingCoupons;
    return this.userRepository.save(user);
  }
  async createPaykuProfileWithUserData(user: UserEntity) {
    const planId = "pl05251981dc944c6c4381";
    const clientSubject = await this.createPaykuClient(user).toPromise();
    if (!clientSubject || clientSubject.status !== 200) {
      throw new BadRequestException();
      return null;
    }
    const subSubject = await this.createPaykuSub(
      clientSubject.data.id,
      planId
    ).toPromise();

    if (!subSubject || subSubject.status !== 200) {
      throw new BadRequestException();
      return null;
    }
    console.log(subSubject);
    user.paykuClientId = clientSubject.data.id;
    user.paykuSubId = subSubject.data.id;
    await this.userRepository.save(user);
    return subSubject.data.url;
  }
  createAutomaticTransaction(body: any) {
    const paykuApi = "https://app.payku.cl";
    const transaction = "/api/sutransaction";
    const data = {
      suscription: body.suscription,
      amount: body.amount,
      order: body.order,
      description: "desc",
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer tkpu25bfea3a4e6a2ea96257103f9d89",
      Sign: this.encryptForPayku(transaction, data),
    };
    console.log(headers);
    console.log(`${paykuApi}${transaction}`);
    return this.httpService.post(`${paykuApi}${transaction}`, data, {
      headers: headers,
    });
  }
  private createPaykuSub(clientId: string, planId: string) {
    const paykuApi = "https://app.payku.cl";
    const sub = "/api/sususcription";
    const body: any = {
      plan: planId,
      client: clientId,
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer tkpu25bfea3a4e6a2ea96257103f9d89",
      Sign: this.encryptForPayku(sub, body),
    };
    return this.httpService.post(`${paykuApi}${sub}`, body, {
      headers: headers,
    });
  }
  private createPaykuClient(user: UserEntity) {
    const paykuApi = "https://app.payku.cl";
    const client = "/api/suclient";
    const body: PaykuCreateClientInput = {
      email: user.email,
      name: user.fullname,
      rut: user.rut,
      phone: user.phoneNumber,
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer tkpu25bfea3a4e6a2ea96257103f9d89",
      Sign: this.encryptForPayku(client, body),
    };
    return this.httpService.post(`${paykuApi}${client}`, body, {
      headers: headers,
    });
  }
  encryptForPayku(endpoint: string, body: any) {
    const path = encodeURIComponent(endpoint);
    const data = {
      ...body,
    };
    const orderedData: any = {};
    Object.keys(body)
      .sort()
      .forEach((key: string) => {
        orderedData[key] = data[key];
        if (typeof orderedData[key] === "object") {
          delete orderedData[key];
        }
      });
    console.log(body);
    const arrayConcat = new URLSearchParams(orderedData).toString();
    const concat = path + "&" + arrayConcat;
    console.log(concat);
    const sign = this.crypto.HmacSHA256(concat);
    console.log(sign);
    return sign;
  }
  getPaykuClientCardData(user: UserEntity) {
    const paykuApi = "https://app.payku.cl";

    return this.findUserById(user.id).pipe(
      switchMap((u) => {
        const client = "/api/suclient/" + u.paykuClientId;
        const headers = {
          "Content-Type": "application/json",
          Authorization: "Bearer tkpu25bfea3a4e6a2ea96257103f9d89",
          Sign: this.encryptForPayku(client, {}),
        };
        return this.httpService.get(`${paykuApi}${client}`, {
          headers: headers,
        });
      })
    );
  }
  addCardToClient(user: UserEntity) {
    const paykuApi = "https://app.payku.cl";
    return this.findUserById(user.id).pipe(
      switchMap((u) => {
        const client = "/api/suinscriptionscards";
        const body = {
          suscription: u.paykuSubId,
        };
        const headers = {
          "Content-Type": "application/json",
          Authorization: "Bearer tkpu25bfea3a4e6a2ea96257103f9d89",
          Sign: this.encryptForPayku(client, body),
        };
        return this.httpService.post(`${paykuApi}${client}`, body, {
          headers: headers,
        });
      })
    );
  }
}
