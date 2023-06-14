import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { ParkingEntity } from "../entity/parking.entity";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ParkingService } from "../service/parking.service";
import { UserType } from "../../auth/decorator/user-type.decorator";
import { UserTypesEnum } from "../../user/constants/constants";
import { UserTypeGuard } from "../../auth/guards/user-type.guard";
import { UpdateParkingInput } from "../model/update-parking.input";
import { CreateParkingInput } from "../model/create-parking.input";
import { CreateFileInput } from "../../file/model/dto/create-file.input";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";
import { CreatePhotoInput } from "../../photo/model/create-photo.input";
import { Observable } from "rxjs";

@Resolver(() => ParkingEntity)
export class ParkingResolver {
  constructor(
    private readonly parkingService: ParkingService
  ) {
  }
  @Query(() => [ParkingEntity], { name: 'findAllParkings' })
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  findAllParkings() {
    return this.parkingService.findAllParkings();
  }
  @Query(() => [ParkingEntity], { name: 'findAllReservableParkings' })
  @UserType(UserTypesEnum.USER)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  findAllReservableParkings(@Args('userId', { type: () => String }) userId: string) {
    return this.parkingService.findAllReservableParkings(userId);
  }
  @Query(() => ParkingEntity, { name: 'findOneParkingById' })
  findOneParkingById(@Args('parkingId', { type: () => String }) parkingId: string) {
    return this.parkingService.findParkingById(parkingId);
  }
  @Query(() => ParkingEntity, { name: 'findOneParkingByBuildingId' })
  findOneParkingByBuildingId(@Args('buildingId', { type: () => String }) buildingId: string) {
    return this.parkingService.findParkingByBuildingId(buildingId);
  }
  @Query(() => ParkingEntity, { name: 'findOneParkingByBuildingPositionCode' })
  findOneParkingByBuildingPositionCode(@Args('buildingPositionCode', { type: () => String }) buildingPositionCode: string) {
    return this.parkingService.findParkingByBuildingPositionCode(buildingPositionCode);
  }
  @Mutation(() => ParkingEntity, {name: 'updateParking'})
  updateParking(
    @Args('updateParkingInput') updateParkingInput: UpdateParkingInput,
    @Args('buildingId', {nullable: true}) buildingId: string,
    @Args('tagsIds', {type: () => [String], nullable: true}) tagsIds: string[],
  ) {
    return this.parkingService.updateParking(updateParkingInput);
  }
  @Mutation(() => ParkingEntity)
  removeParking(@Args('parkingId') parkingId: string) {
    return this.parkingService.removeParking(parkingId);
  }
  @Mutation(() => ParkingEntity)
  createParking(
    @Args('createParkingInput') createParkingInput: CreateParkingInput,
    @Args('buildingId') buildingId: string,
    @Args('tagsIds', {type: () => [String]}) tagsIds: string[],
    @Args('userId', { nullable: true}) userId?: string,
    @Args('clientId', { nullable: true}) clientId?: string,
  ) {
    return this.parkingService.createParking(createParkingInput, buildingId, tagsIds, clientId, userId);
  }
  @Mutation(() => ParkingEntity)
  setParkingPhoto(
    @Args('parkingId') parkingId: string,
    @Args('createPhotoInput') createPhotoInput: CreatePhotoInput,
    @Args('file', { type: () => GraphQLUpload }) file: FileUpload,
  ): Observable<ParkingEntity> {
    return this.parkingService.setParkingPhoto(parkingId, createPhotoInput, file);
  }
}