import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { BuildingEntity } from "../entity/building.entity";
import { BuildingService } from "../service/building.service";
import { CreateBuildingInput } from "../model/create-building.input";
import { UpdateBuildingInput } from "../model/update-building.input";
import { CreatePhotoInput } from "../../photo/model/create-photo.input";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";
import { from, Observable, tap } from "rxjs";
import { BuildingOutput } from "../model/building.output";
import { UserType } from "../../auth/decorator/user-type.decorator";
import { UserTypesEnum } from "../../user/constants/constants";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UserTypeGuard } from "../../auth/guards/user-type.guard";
import { UseGuards } from "@nestjs/common";
import { PointInput } from "../../parking/model/point.input";
import { UserEntity } from "../../user/entity/user.entity";
import { CurrentUser } from "../../auth/decorator/current-user.decorator";
import { ParkingType } from "../../parking/model/parking-type.enum";
import {
  BuildingsPaginated,
  ClientsPaginated,
  PageOptionsDto,
} from "../../utils/interfaces/pagination.type";
import { ClientEntity } from "../../client/entity/client.entity";
import { BuildingWithCoordsOutput } from "../model/building-coords.output";
import {
  MonthlyBuildingProfit,
  MostProfitableBuilding,
  WeeklyBuildingProfit,
} from "../model/finance-building.output";

@Resolver(BuildingEntity)
export class BuildingResolver {
  constructor(private buildingService: BuildingService) {}

  @Mutation(() => BuildingEntity)
  createBuilding(
    @Args("createBuildingEntity") createBuildingEntity: CreateBuildingInput,
    @Args("ownerId", { type: () => String }) ownerId: string,
    @Args("tags", { type: () => [String] }) tags: string[]
  ) {
    return this.buildingService.createBuilding(
      createBuildingEntity,
      ownerId,
      tags
    );
  }
  @Query(() => BuildingEntity, { name: "findBuildingById" })
  findBuildingById(
    @Args("buildingId", { type: () => String }) buildingId: string
  ) {
    return this.buildingService.findBuildingById(buildingId);
  }
  @Query(() => BuildingWithCoordsOutput, { name: "findBuildingWithCoordsById" })
  findBuildingWithCoordsById(
    @Args("buildingId", { type: () => String }) buildingId: string
  ) {
    return this.buildingService.findBuildingWithCoordsById(buildingId);
  }
  @Query(() => BuildingEntity, {
    name: "findBuildingByIdAndFilterParkingsByReservedStatus",
  })
  findBuildingByIdAndFilterParkingsByReservedStatus(
    @Args("buildingId", { type: () => String }) buildingId: string
  ) {
    return this.buildingService.findBuildingByIdAndFilterParkingsByReservedStatus(
      buildingId
    );
  }
  @Query(() => BuildingEntity, { name: "findBuildingByAddress" })
  findBuildingByAddress(
    @Args("buildingId", { type: () => String }) buildingId: string
  ) {
    return this.buildingService.findBuildingByAddress(buildingId);
  }
  @Mutation(() => BuildingEntity)
  updateBuilding(
    @Args("updateBuildingInput") updateBuildingInput: UpdateBuildingInput,
    @Args("tags", { type: () => [String], nullable: true }) tags?: string[]
  ) {
    return this.buildingService.updateBuilding(updateBuildingInput, tags);
  }
  @Mutation(() => BuildingEntity)
  removeTag(@Args("buildingId") buildingId: string) {
    return this.buildingService.removeBuilding(buildingId);
  }
  @Query(() => [BuildingOutput], { name: "getAllNearbyAndReservableBuildings" })
  @UserType(UserTypesEnum.USER)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  getAllNearbyAndReservableBuildings(
    @Args("distance") distance: number,
    @Args("point") point: PointInput,
    @CurrentUser() user: UserEntity,
    @Args("parkingType", { nullable: true }) parkingType?: ParkingType
  ): any {
    return this.buildingService.getAllNearbyAndReservableBuildings(
      user,
      point,
      distance,
      parkingType
    );
  }
  @Query(() => [BuildingOutput], { name: "getAllNearbyAndBuildings" })
  @UserType(UserTypesEnum.USER)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  getAllNearbyAndBuildings(
    @Args("distance") distance: number,
    @Args("point") point: PointInput,
    @CurrentUser() user: UserEntity
  ): any {
    return this.buildingService.getAllNearbyAndBuildings(point, distance);
  }
  @Query(() => BuildingsPaginated, { name: "getPaginatedBuildings" })
  @UseGuards(JwtAuthGuard)
  getPaginatedBuildings(
    @Args("paginationOptions") paginationOptions: PageOptionsDto,
    @CurrentUser() user: UserEntity
  ) {
    return this.buildingService.findPaginatedBuildings(
      paginationOptions,
      user as any as ClientEntity
    );
  }

  @Mutation(() => BuildingEntity)
  setBuildingPhoto(
    @Args("buildingId") buildingId: string,
    @Args("createPhotoInput") createPhotoInput: CreatePhotoInput,
    @Args("file", { type: () => GraphQLUpload }) file: FileUpload
  ): Observable<BuildingEntity> {
    return this.buildingService.setBuildingPhoto(
      buildingId,
      createPhotoInput,
      file
    );
  }
  @Mutation(() => BuildingEntity || null)
  deleteBuilding(
    @Args("buildingId") buildingId: string
  ): Observable<BuildingEntity | null> {
    return this.buildingService.removeBuilding(buildingId);
  }
  @Query(() => MostProfitableBuilding, {
    name: "findMostProfitableBuilding",
    nullable: true,
  })
  @UseGuards(JwtAuthGuard)
  findMostProfitableBuilding(): Observable<MostProfitableBuilding | null> {
    return this.buildingService.findMostProfitableBuilding();
  }
  @Query(() => MonthlyBuildingProfit, {
    name: "findDailyIncomeOfAllBuildingsInAMonth",
  })
  @UseGuards(JwtAuthGuard)
  findDailyIncomeOfAllBuildingsInAMonth(
    @Args("days", { nullable: true }) days?: number
  ) {
    return from(
      this.buildingService.findDailyIncomeOfAllBuildingsInAMonth(days)
    );
  }
  @Query(() => Boolean, {
    name: "verifyCustomerPositionIsCloseTo100MtsOrLessFromBuilding",
  })
  @UseGuards(JwtAuthGuard)
  verifyCustomerPositionIsCloseTo100MtsOrLessFromBuilding(
    @Args("buildingId") buildingId: string,
    @Args("point") point: PointInput
  ): Observable<Boolean> {
    return this.buildingService.verifyCustomerPositionIsCloseTo100MtsOrLessFromBuilding(
      point,
      buildingId
    );
  }
  @Query(() => [BuildingEntity], {
    name: "getBuildingsAssigedToAGuard",
  })
  @UseGuards(JwtAuthGuard)
  getBuildingsAssigedToAGuard(
    @Args("guardId") guardId: string
  ): Promise<BuildingEntity[]> {
    return this.buildingService.getBuildingsAssigedToAGuard(guardId);
  }
}
