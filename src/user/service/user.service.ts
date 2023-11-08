import { Injectable, NotFoundException } from "@nestjs/common";
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

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private emailService: EmailService,
    private smsService: SmsService,
    private photoService: PhotoService
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
      this.userRepository.findBy({
        id: Equal(userId),
      })
    )
      .pipe(map((users) => users[0]))
      .pipe(
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
}
