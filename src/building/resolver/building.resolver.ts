import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { BuildingEntity } from "../entity/building.entity";
import { BuildingService } from "../service/building.service";
import { CreateBuildingInput } from "../model/create-building.input";
import { UpdateBuildingInput } from "../model/update-building.input";
import { CreatePhotoInput } from "../../photo/model/create-photo.input";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";
import { Observable, tap } from "rxjs";
import { BuildingOutput } from "../model/building.output";
import { UserType } from "../../auth/decorator/user-type.decorator";
import { UserTypesEnum } from "../../user/constants/constants";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UserTypeGuard } from "../../auth/guards/user-type.guard";
import { UseGuards } from "@nestjs/common";
import { PointInput } from "../../parking/model/point.input";
import { UserEntity } from "../../user/entity/user.entity";
import { CurrentUser } from "../../auth/decorator/current-user.decorator";
import { FiltersInput } from "../../parking/model/filters.input";
import { ParkingType } from "../../parking/model/parking-type.enum";
import { ParkingEntity } from "../../parking/entity/parking.entity";

@Resolver(BuildingEntity)
export class BuildingResolver {
  constructor(private buildingService: BuildingService) {}

  @Mutation(() => BuildingEntity)
  createBuilding(
    @Args('createBuildingEntity') createBuildingEntity: CreateBuildingInput,
    @Args('ownerId', { type: () => String}) ownerId: string,
    @Args('tags', { type: () => [String]}) tags: string[]
  ) {
    return this.buildingService.createBuilding(createBuildingEntity, ownerId, tags);
  }
  @Query(() => BuildingEntity, { name: 'findBuildingById' })
  findBuildingById(@Args('buildingId', { type: () => String }) buildingId: string) {
    return this.buildingService.findBuildingById(buildingId)
  }
  @Query(() => BuildingEntity, { name: 'findBuildingByIdAndFilterParkingsByUserStatus' })
  findBuildingByIdAndFilterParkingsByUserStatus(@Args('buildingId', { type: () => String }) buildingId: string) {
    return this.buildingService.findBuildingByIdAndFilterParkingsByUserStatus(buildingId)
  }
  @Query(() => BuildingEntity, { name: 'findBuildingByAddress' })
  findBuildingByAddress(@Args('buildingId', { type: () => String }) buildingId: string) {
    return this.buildingService.findBuildingByAddress(buildingId);
  }
  @Mutation(() => BuildingEntity)
  updateBuilding(
    @Args('updateBuildingInput') updateBuildingInput: UpdateBuildingInput,
    @Args('tags', {type: () => [String], nullable: true}) tags?: string[],
  ) {
    return this.buildingService.updateBuilding(updateBuildingInput, tags);
  }
  @Mutation(() => BuildingEntity)
  removeTag(@Args('buildingId') buildingId: string) {
    return this.buildingService.removeBuilding(buildingId);
  }
  @Query(() => [BuildingOutput], { name: 'getAllNearbyAndReservableBuildings' })
  @UserType(UserTypesEnum.USER)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  getAllNearbyAndReservableBuildings(
    @Args('distance') distance: number,
    @Args( 'point') point: PointInput,
    @CurrentUser() user: UserEntity,
    @Args('parkingType', { nullable: true}) parkingType?: ParkingType,
  ): any {
    return this.buildingService.getAllNearbyAndReservableBuildings(user, point, distance, parkingType)
  }
  @Mutation(() => BuildingEntity)
  setBuildingPhoto(
    @Args('buildingId') buildingId: string,
    @Args('createPhotoInput') createPhotoInput: CreatePhotoInput,
    @Args('file', { type: () => GraphQLUpload , nullable: true}) file?: FileUpload,
  ): Observable<BuildingEntity> {
    return this.buildingService.setBuildingPhoto(buildingId, createPhotoInput, file);
  }
}
