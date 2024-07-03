import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UseGuards } from "@nestjs/common";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";
import { Observable } from "rxjs";
import { ClientEntity } from "../entity/client.entity";
import { ClientService } from "../service/client.service";
import { UpdateClientInput } from "../model/update-client.input";
import { CreatePhotoInput } from "../../photo/model/create-photo.input";
import { EmailVerificationCode } from "../model/email-verification-code.response";
import { SmsVerificationCode } from "../model/sms-code.response";
import { RecoverPasswordCodeAndClientId } from "../model/recover-password.response";
import {
  ClientsPaginated,
  EventsPaginated,
  PageOptionsDto,
  RequestsPaginated
} from "../../utils/interfaces/pagination.type";
import { UserType } from "../../auth/decorator/user-type.decorator";
import { UserTypesEnum } from "../../user/constants/constants";
import { UserTypeGuard } from "../../auth/guards/user-type.guard";

@Resolver(() => ClientEntity)
export class ClientResolver {
  constructor(private readonly clientService: ClientService) {}

  @Query(() => ClientEntity, { name: "clientById" })
  findClient(@Args("clientId", { type: () => String }) clientId: string) {
    return this.clientService.findClientById(clientId);
  }

  @Query(() => [ClientEntity], { name: "clients" })
  @UseGuards(JwtAuthGuard)
  findAll(@Context() context: any): Observable<ClientEntity[]> {
    return this.clientService.findAll();
  }
  @Query(() => ClientEntity, { name: "clientByRut", nullable: true })
  findClientOneByRut(
    @Args("rut", { type: () => String }) rut: string
  ): Observable<ClientEntity | null> {
    return this.clientService.getClientByRut(rut);
  }
  @Query(() => ClientEntity, {
    name: "searchClientByRutEmailOrPhone",
    nullable: true,
  })
  findClientRutEmailOrPhone(
    @Args("rut", { type: () => String }) rut: string,
    @Args("email", { type: () => String }) email: string,
    @Args("phone", { type: () => String }) phone: string
  ): Promise<ClientEntity | null> {
    return this.clientService.searchClientByRutEmailOrPhone(rut, email, phone);
  }
  @Mutation(() => ClientEntity, { name: "updateClient" })
  updateClient(
    @Args("updateClientInput", { type: () => UpdateClientInput })
    updateClientInput: UpdateClientInput
  ): Observable<ClientEntity> {
    return this.clientService.updateClient(updateClientInput);
  }
  @Mutation(() => ClientEntity)
  setClientProfilePhoto(
    @Args("clientId", { type: () => String }) clientId: string,
    @Args("photoInput", { type: () => CreatePhotoInput })
    photoInput: CreatePhotoInput,
    @Args("photo", { type: () => GraphQLUpload }) photo: FileUpload
  ): Observable<ClientEntity> {
    return this.clientService.setProfilePhoto(clientId, photo, photoInput);
  }
  @Mutation(() => ClientEntity)
  removeClient(
    @Args("clientId", { type: () => String }) clientId: string
  ): Observable<ClientEntity> {
    return this.clientService.removeClient(clientId);
  }
  @Query(() => EmailVerificationCode, { name: "getClientEmailCode" })
  getClientEmailCode(
    @Args("fullname", { type: () => String }) fullname: string,
    @Args("email", { type: () => String }) email: string
  ): Observable<EmailVerificationCode> {
    return this.clientService.getClientEmailCode(email, fullname);
  }
  @Query(() => SmsVerificationCode, { name: "getClientSMSCode" })
  getClientSMSCode(
    @Args("phoneNumber", { type: () => String }) phoneNumber: string
  ): Observable<SmsVerificationCode> {
    return this.clientService.getClientSMSCode(phoneNumber);
  }
  @Query(() => RecoverPasswordCodeAndClientId)
  checkClientAndGetCodeToValidate(
    @Args("rut", { type: () => String }) rut: string
  ) {
    return this.clientService.checkClientAndGetCodeToValidate(rut);
  }
  @Query(() => ClientsPaginated)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  getPaginatedClients(
    @Args("paginationOptions") paginationOptions: PageOptionsDto,
    @Args("text", {  type: () => String, nullable: true }) text: string,
  ) {
    return this.clientService.findPaginatedClients(paginationOptions, text);
  }
  @Mutation(() => ClientEntity)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  deleteClient(
    @Args("id") id: string
  ): Observable<ClientEntity> {
    return this.clientService.deleteClient(id);
  }
}
