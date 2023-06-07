import { Injectable, NotFoundException } from '@nestjs/common';
import { Equal, Repository } from 'typeorm';
import { UserEntity } from '../entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  concatMap,
  forkJoin,
  from,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { UpdateUserInput } from '../model/dto/update-user.input';
import * as uuid from 'uuid';
import { UUIDBadFormatException } from '../../utils/exceptions/UUIDBadFormat.exception';
import { CreateUserInput } from '../model/dto/create-user.input';
import { FileUpload } from 'graphql-upload-minimal';
import { FileService } from '../../file/service/file.service';
import { EmailService } from '../../utils/email/email.service';
import { EmailTypesEnum } from '../../utils/email/enum/email-types.enum';
import { SmsService } from '../../utils/sms/sms.service';
import { getCodeForRegister } from '../../utils/utils';
import { UserWithVerificationCode } from '../model/dto/user-with-verification-code.response';
import { UserWithSmsCode } from '../model/dto/user-with-sms-code.response';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private fileService: FileService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}
  createUser(userDTO: CreateUserInput): Observable<UserEntity> {
    const user = this.userRepository.create(userDTO);
    const emailSubject = from(
      this.emailService.sendEmail(
        EmailTypesEnum.REGISTER,
        'zekropls@gmail.com',
        JSON.stringify({ name: user.fullname }),
      ),
    );
    const saveUserSubject = from(this.userRepository.save(user));
    return forkJoin([emailSubject, saveUserSubject]).pipe(
      map(([value, user]) => {
        return user;
      }),
    );
  }
  updateUser(updatedUser: UpdateUserInput): Observable<UserEntity> {
    return from(
      this.userRepository.preload({
        ...updatedUser,
      }),
    ).pipe(
      switchMap((user) => {
        if (!user) {
          throw new NotFoundException();
        }
        return from(this.userRepository.save(user));
      }),
    );
  }
  removeUser(userId: string): Observable<UserEntity> {
    if (uuid.validate(userId)) {
      throw new UUIDBadFormatException();
    }
    return from(
      this.userRepository.findOne({
        where: { id: userId },
      }),
    ).pipe(
      switchMap((user) => {
        if (!user) {
          throw new NotFoundException();
        }
        return from(this.userRepository.remove([user])).pipe(map((u) => u[0]));
      }),
    );
  }
  getUserEmailCode(id: string): Observable<UserWithVerificationCode> {
    const code = getCodeForRegister();
    return this.findUserById(id).pipe(
      tap((u) => {
        from(
          this.emailService.sendEmail(
            EmailTypesEnum.CODE,
            'zekropls@gmail.com',
            JSON.stringify({ code: code }),
          ),
        );
      }),
      switchMap((u) => {
        const response = { user: u, code: code } as UserWithVerificationCode;
        return of(response);
      }),
    );
  }
  getUserSMSCode(id: string): Observable<UserWithSmsCode> {
    const code = getCodeForRegister();
    return this.findUserById(id).pipe(
      tap((u) => {
        this.smsService.publishSMSToPhoneNumber(u.phoneNumber);
      }),
      switchMap((u) => {
        const response = { user: u, smsCode: code } as UserWithSmsCode;
        return of(response);
      }),
    );
  }
  findUserById(userId: string): Observable<UserEntity> {
    if (!uuid.validate(userId)) {
      throw new UUIDBadFormatException();
    }

    return from(
      this.userRepository.findBy({
        id: Equal(userId),
      }),
    )
      .pipe(map((users) => users[0]))
      .pipe(
        map((user) => {
          if (!user) {
            throw new NotFoundException();
          }
          return user;
        }),
      );
  }
  findUserByRut(rut: string): Observable<UserEntity> {
    return this.getUserByRut(rut).pipe(
      map((user) => {
        if (!user) {
          throw new NotFoundException();
        }
        return user;
      }),
    );
  }
  getUserByRut(rut: string): Observable<UserEntity | null> {
    return from(
      this.userRepository.findOne({
        where: {
          rut: rut,
        },
      }),
    );
  }
  findAll(): Observable<UserEntity[]> {
    return from(this.userRepository.find());
  }
  setProfilePhoto(userId: string, file: FileUpload): Observable<UserEntity> {
    return this.findUserById(userId).pipe(
      switchMap((user: UserEntity) => {
        return this.fileService.processFile(userId, file).pipe(
          switchMap((url) => {
            if (user.profilePhoto)
              this.fileService.deleteFile(user.profilePhoto);

            user.profilePhoto = url;
            this.userRepository.save(user);
            return of(user);
          }),
        );
      }),
    );
  }
}
