import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { FileUpload, GraphQLUpload } from 'graphql-upload-minimal';
import { Observable } from 'rxjs';
import { ClientEntity } from '../entity/client.entity';
import { ClientService } from '../service/client.service';
import { UpdateClientInput } from '../model/update-client.input';
import { ClientWithVerificationCode } from '../model/client-with-verification-code.response';
import { ClientWithSmsCode } from '../model/client-with-sms-code.response';
import { CreatePhotoInput } from "../../photo/model/create-photo.input";

@Resolver(() => ClientEntity)
export class ClientResolver {
  constructor(private readonly clientService: ClientService) {}

  @Query(() => ClientEntity, { name: 'clientById' })
  findClient(@Args('clientId', { type: () => String }) clientId: string) {
    return this.clientService.findClientById(clientId);
  }

  @Query(() => [ClientEntity], { name: 'clients' })
  @UseGuards(JwtAuthGuard)
  findAll(@Context() context: any): Observable<ClientEntity[]> {
    return this.clientService.findAll();
  }
  @Query(() => ClientEntity, { name: 'clientByRut' })
  findClientOneByRut(
    @Args('rut', { type: () => String }) rut: string,
  ): Observable<ClientEntity> {
    return this.clientService.findClientByRut(rut);
  }
  @Mutation(() => ClientEntity, { name: 'updateClient' })
  updateClient(
    @Args('updateClientInput', { type: () => UpdateClientInput })
    updateClientInput: UpdateClientInput,
  ): Observable<ClientEntity> {
    return this.clientService.updateClient(updateClientInput);
  }
  @Mutation(() => ClientEntity)
  setClientProfilePhoto(
    @Args('clientId', { type: () => String }) clientId: string,
    @Args('photoInput', { type: () => CreatePhotoInput }) photoInput: CreatePhotoInput,
    @Args('photo', { type: () => GraphQLUpload }) photo: FileUpload,
  ): Observable<ClientEntity> {
    return this.clientService.setProfilePhoto(clientId, photo, photoInput);
  }
  @Mutation(() => ClientEntity)
  removeClient(
    @Args('clientId', { type: () => String }) clientId: string,
  ): Observable<ClientEntity> {
    return this.clientService.removeClient(clientId);
  }
  @Query(() => ClientEntity, { name: 'getClientEmailCode' })
  getClientEmailCode(
    @Args('clientId', { type: () => String }) clientId: string,
  ): Observable<ClientWithVerificationCode> {
    return this.clientService.getUserEmailCode(clientId);
  }
  @Query(() => ClientEntity, { name: 'getClientSMSCode' })
  getClientSMSCode(
    @Args('clientId', { type: () => String }) clientId: string,
  ): Observable<ClientWithSmsCode> {
    return this.clientService.getUserSMSCode(clientId);
  }

}
