import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UserService } from "../service/user.service";
import { UpdateUserInput } from "../model/dto/update-user.input";
import { UserEntity } from "../entity/user.entity";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UseGuards } from "@nestjs/common";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";
import { Observable, from, map, tap } from "rxjs";
import { CreatePhotoInput } from "../../photo/model/create-photo.input";
import { UserWithVerificationCode } from "../model/dto/user-with-verification-code.response";
import { UserWithSmsCode } from "../model/dto/user-with-sms-code.response";
import { EmailVerificationCode } from "../../client/model/email-verification-code.response";
import { SmsVerificationCode } from "../../client/model/sms-code.response";
import {
  ClientsPaginated,
  CouponsPaginated,
  PageOptionsDto,
  ParkingBlockedUsersPaginated,
  ParkingCouponAssignedUsersPaginated,
  ParkingsPaginated,
  UsersPaginated,
} from "../../utils/interfaces/pagination.type";
import { CurrentUser } from "../../auth/decorator/current-user.decorator";
import { ClientEntity } from "../../client/entity/client.entity";
import { UserType } from "src/auth/decorator/user-type.decorator";
import { UserTypesEnum } from "../constants/constants";
import { UserTypeGuard } from "src/auth/guards/user-type.guard";
import { type } from "os";
import { Any } from "typeorm";
import { Card, PaykuCustomer } from "../model/payku.model";
import { RecoverPasswordCodeAndClientId } from "../../client/model/recover-password.response";
import {
  CreateUserInput,
  OutputCreateUserInput,
} from "../model/dto/create-user.input";
import { UserBatchResponse } from "../model/dto/user-batch.response";
import { TransbankModel } from "src/transbank/model/transbank.model";
import { TransbankService } from "src/utils/transbank/transbank.service";

@Resolver(() => UserEntity)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly transbankService: TransbankService
  
  ) {}

  @Query(() => [UserEntity], { name: "users" })
  @UseGuards(JwtAuthGuard)
  findAll(@Context() context: any) {
    return this.userService.findAll();
  }

  @Query(() => ParkingCouponAssignedUsersPaginated, {
    name: "getPaginatedCouponAssignedUsers",
  })
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  getPaginatedCouponAssignedUsers(
    @Args("paginationOptions") paginationOptions: PageOptionsDto,
    @Args("couponId") couponId: string,
    @CurrentUser() user: UserEntity
  ) {
    return this.userService.findPaginatedAssignedUsersOfCoupon(
      paginationOptions,
      couponId
    );
  }
  @Query(() => ParkingBlockedUsersPaginated, {
    name: "getPaginatedParkingBlockedUsers",
  })
  @UseGuards(JwtAuthGuard)
  getPaginatedParkingBlockedUsers(
    @Args("paginationOptions") paginationOptions: PageOptionsDto,
    @Args("parkingId", { nullable: true }) parkingId: string,
    @CurrentUser() user: UserEntity
  ) {
    return this.userService.findPaginatedBlockedUsersOfParking(
      paginationOptions,
      user as any as ClientEntity,
      parkingId
    );
  }
  @Query(() => [UserEntity], { name: "searchUsersByGivenRutEmailOrFullname" })
  @UseGuards(JwtAuthGuard)
  searchUsersByGivenRutEmailOrFullname(
    @Args("text") text: string,
    @Args("restrictedIds", { type: () => [String] }) restrictedIds: string[],
    @CurrentUser() user: UserEntity
  ) {
    return this.userService.searchUsersByGivenRutEmailOrFullname(
      text,
      restrictedIds
    );
  }
  @Query(() => UserEntity, { name: "userById" })
  findOne(@Args("userId", { type: () => String }) userId: string) {
    return this.userService.findUserById(userId);
  }
  @Query(() => UserEntity, { name: "userByRut", nullable: true })
  findOneByRut(
    @Args("rut", { type: () => String }) rut: string
  ): Observable<UserEntity | null> {
    return this.userService.getUserByRut(rut);
  }
  @Mutation(() => UserEntity)
  updateUser(@Args("updateUserInput") updateUserInput: UpdateUserInput) {
    return this.userService.updateUser(updateUserInput);
  }
  @Mutation(() => UserEntity)
  setProfilePhoto(
    @Args("userId", { type: () => String }) userId: string,
    @Args("photoInput", { type: () => CreatePhotoInput })
    photoInput: CreatePhotoInput,
    @Args("photo", { type: () => GraphQLUpload }) photo: FileUpload
  ): Observable<UserEntity> {
    return this.userService.setProfilePhoto(userId, photo, photoInput);
  }
  @Mutation(() => UserEntity)
  removeUser(@Args("userId", { type: () => String }) userId: string) {
    return this.userService.removeUser(userId);
  }
  @Query(() => EmailVerificationCode, { name: "getUserEmailCode" })
  getUserEmailCode(
    @Args("fullname", { type: () => String }) fullname: string,
    @Args("email", { type: () => String }) email: string
  ): Observable<EmailVerificationCode> {
    return this.userService.getUserEmailCode(email, fullname);
  }
  @Query(() => SmsVerificationCode, { name: "getUserSMSCode" })
  getUserSMSCode(
    @Args("phoneNumber", { type: () => String }) phoneNumber: string
  ): Observable<SmsVerificationCode> {
    return this.userService.getUserSMSCode(phoneNumber);
  }
  @Query(() => [Card])
  @UseGuards(JwtAuthGuard)
  getPaykuClientCardData(@CurrentUser() user: UserEntity): Observable<any> {
    return this.userService.getPaykuClientCardData(user).pipe(
      map((r) => {
        if (r.status === 200 && r.data.subscriptions.length > 0) {
          console.log(r.data.subscriptions);
          return r.data.subscriptions[0].active_cards;
        }
        return [];
      })
    );
  }
  @Query(() => [TransbankModel])
  @UseGuards(JwtAuthGuard)
  getTbkClientCardData(@CurrentUser() user: UserEntity): Observable<any[]> {
    return this.transbankService.getClientCardsData(user);
  }


  @Query(() => String)
  @UseGuards(JwtAuthGuard)
  addCardToClient(@CurrentUser() user: UserEntity): Observable<any> {
    return this.userService.addCardToClient(user);
  }

  @Query(() => RecoverPasswordCodeAndClientId)
  checkUserAndGetCodeToValidate(
    @Args("rut", { type: () => String }) rut: string
  ) {
    return this.userService.checkUserAndGetCodeToValidate(rut);
  }
  @Query(() => UsersPaginated)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  getPaginatedUsers(
    @Args("paginationOptions") paginationOptions: PageOptionsDto,
    @Args("text", { type: () => String, nullable: true }) text: string
  ) {
    return this.userService.fingPaginatedUsers(paginationOptions, text);
  }
  @Mutation(() => UserEntity)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  deleteUser(@Args("id") id: string) {
    return this.userService.deleteUser(id);
  }
  @Mutation(() => UserBatchResponse)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  createUsersBatch(
    @Args("createUserInputs", {
      type: () => [CreateUserInput],
    })
    createUserInputs: CreateUserInput[]
  ) {
    return this.userService.createUsersBatch(createUserInputs);
  }
}
