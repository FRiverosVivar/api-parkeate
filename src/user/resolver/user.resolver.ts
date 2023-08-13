import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserService } from '../service/user.service';
import { UpdateUserInput } from '../model/dto/update-user.input';
import { UserEntity } from '../entity/user.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { FileUpload, GraphQLUpload } from 'graphql-upload-minimal';
import { Observable, tap } from "rxjs";
import { CreatePhotoInput } from "../../photo/model/create-photo.input";
import { UserWithVerificationCode } from "../model/dto/user-with-verification-code.response";
import { UserWithSmsCode } from "../model/dto/user-with-sms-code.response";
import { EmailVerificationCode } from "../../client/model/email-verification-code.response";
import { SmsVerificationCode } from "../../client/model/sms-code.response";

@Resolver(() => UserEntity)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [UserEntity], { name: 'users' })
  @UseGuards(JwtAuthGuard)
  findAll(@Context() context: any) {
    return this.userService.findAll();
  }

  @Query(() => UserEntity, { name: 'userById' })
  findOne(@Args('userId', { type: () => String }) userId: string) {
    return this.userService.findUserById(userId)
  }
  @Query(() => UserEntity, { name: 'userByRut', nullable: true })
  findOneByRut(@Args('rut', { type: () => String }) rut: string): Observable< UserEntity | null> {
    return this.userService.getUserByRut(rut);
  }
  @Mutation(() => UserEntity)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.userService.updateUser(updateUserInput);
  }
  @Mutation(() => UserEntity)
  setProfilePhoto(
    @Args('userId', { type: () => String }) userId: string,
    @Args('photoInput', { type: () => CreatePhotoInput }) photoInput: CreatePhotoInput,
    @Args('photo', { type: () => GraphQLUpload }) photo: FileUpload,
  ): Observable<UserEntity> {
    return this.userService.setProfilePhoto(userId, photo, photoInput);
  }
  @Mutation(() => UserEntity)
  removeUser(@Args('userId', { type: () => String }) userId: string) {
    return this.userService.removeUser(userId);
  }
  @Query(() => EmailVerificationCode, { name: 'getUserEmailCode' })
  getUserEmailCode(
    @Args('fullname', { type: () => String }) fullname: string,
    @Args('email', { type: () => String }) email: string
  ): Observable<EmailVerificationCode> {
    return this.userService.getUserEmailCode(email, fullname);
  }
  @Query(() => SmsVerificationCode, { name: 'getUserSMSCode' })
  getUserSMSCode(@Args('phoneNumber', { type: () => String }) phoneNumber: string): Observable<SmsVerificationCode> {
    return this.userService.getUserSMSCode(phoneNumber);
  }
}
