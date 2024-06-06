import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { ParkingEntity } from "../entity/parking.entity";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ParkingService } from "../service/parking.service";
import { UserType } from "../../auth/decorator/user-type.decorator";
import { UserTypesEnum } from "../../user/constants/constants";
import { UserTypeGuard } from "../../auth/guards/user-type.guard";
import { UpdateParkingInput } from "../model/update-parking.input";
import { CreateParkingInput } from "../model/create-parking.input";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";
import { CreatePhotoInput } from "../../photo/model/create-photo.input";
import { from, Observable } from "rxjs";
import { CurrentUser } from "../../auth/decorator/current-user.decorator";
import { UserEntity } from "../../user/entity/user.entity";
import {
  PageOptionsDto,
  ParkingsPaginated,
} from "../../utils/interfaces/pagination.type";
import { ClientEntity } from "../../client/entity/client.entity";
import { MostProfitableBuilding } from "../../building/model/finance-building.output";
import {
  MostProfitableParking,
  TopMostRentedParkings,
} from "../model/finance-parking.output";
import { PrepaidHourParking } from "../model/prepaid-hour-parking.output";

@Resolver(() => ParkingEntity)
export class ParkingResolver {
  constructor(private readonly parkingService: ParkingService) {}
  @Query(() => [ParkingEntity], { name: "findAllParkings" })
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  findAllParkings() {
    return this.parkingService.findAllParkings();
  }
  @Query(() => [ParkingEntity], {
    name: "findAllReservableParkingsByBuildingId",
  })
  @UserType(UserTypesEnum.USER)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  findAllReservableParkingsByBuildingId(
    @Args("buildingId", { type: () => String }) buildingId: string,
    @CurrentUser() user: UserEntity
  ) {
    return this.parkingService.findAllReservableParkingsByBuildingId(
      user.id,
      buildingId
    );
  }
  @Query(() => ParkingEntity, { name: "findOneParkingById" })
  findOneParkingById(
    @Args("parkingId", { type: () => String }) parkingId: string
  ) {
    return this.parkingService.findParkingById(parkingId);
  }
  @Query(() => ParkingEntity, { name: "findOneParkingByBuildingId" })
  findOneParkingByBuildingId(
    @Args("buildingId", { type: () => String }) buildingId: string
  ) {
    return this.parkingService.findParkingByBuildingId(buildingId);
  }
  @Query(() => ParkingEntity, { name: "findOneParkingByBuildingPositionCode" })
  findOneParkingByBuildingPositionCode(
    @Args("code", { type: () => String }) code: string,
    @Args("floor", { type: () => Int }) floor: number,
    @Args("section", { type: () => String }) section: string,
    @Args("buildingId", { type: () => String }) buildingId: string
  ) {
    return this.parkingService.findParkingByBuildingPositionCode(
      code,
      floor,
      section,
      buildingId
    );
  }
  @Query(() => ParkingsPaginated, { name: "getPaginatedParkings" })
  @UseGuards(JwtAuthGuard)
  getPaginatedParkings(
    @Args("paginationOptions") paginationOptions: PageOptionsDto,
    @Args("buildingId") buildingId: string,
    @CurrentUser() user: UserEntity
  ) {
    return this.parkingService.findPaginatedParkings(
      paginationOptions,
      buildingId,
      user as any as ClientEntity
    );
  }
  @Mutation(() => ParkingEntity, { name: "updateParking" })
  updateParking(
    @Args("updateParkingInput") updateParkingInput: UpdateParkingInput,
    @Args("buildingId", { nullable: true }) buildingId: string
  ) {
    return this.parkingService.updateParking(updateParkingInput, buildingId);
  }
  @Mutation(() => ParkingEntity, { name: "removeBlockedUserFromParking" })
  @UseGuards(JwtAuthGuard)
  removeBlockedUserFromParking(
    @Args("userId") userId: string,
    @Args("parkingId") parkingId: string
  ) {
    return this.parkingService.removeBlockedUserFromParking(userId, parkingId);
  }
  @Mutation(() => ParkingEntity, { name: "addUserToParkingBlockList" })
  @UseGuards(JwtAuthGuard)
  addUserToParkingBlockList(
    @Args("userId") userId: string,
    @Args("parkingId") parkingId: string
  ) {
    return this.parkingService.addUserToParkingBlockList(userId, parkingId);
  }
  @Mutation(() => ParkingEntity)
  removeParking(@Args("parkingId") parkingId: string) {
    return this.parkingService.removeParking(parkingId);
  }
  @Mutation(() => ParkingEntity)
  createParking(
    @Args("createParkingInput") createParkingInput: CreateParkingInput,
    @Args("buildingId") buildingId: string,
    @Args("clientId") clientId: string
  ) {
    return this.parkingService.createParking(
      createParkingInput,
      buildingId,
      clientId
    );
  }
  @Mutation(() => ParkingEntity)
  setParkingPhoto(
    @Args("parkingId") parkingId: string,
    @Args("createPhotoInput") createPhotoInput: CreatePhotoInput,
    @Args("file", { type: () => GraphQLUpload, nullable: true })
    file?: FileUpload
  ): Observable<ParkingEntity> {
    return this.parkingService.setParkingPhoto(
      parkingId,
      createPhotoInput,
      file
    );
  }
  @Query(() => MostProfitableParking, {
    name: "findMostProfitableParking",
    nullable: true,
  })
  @UseGuards(JwtAuthGuard)
  findMostProfitableParking(): Observable<MostProfitableParking | null> {
    return this.parkingService.findMostProfitableParking();
  }
  @Query(() => TopMostRentedParkings, {
    name: "findWeekMostRentedParkings",
    nullable: true,
  })
  findWeekMostRentedParkings(): Observable<TopMostRentedParkings> {
    return from(this.parkingService.findWeekMostRentedParkings());
  }
  @Query(() => PrepaidHourParking)
  calculatePrepaidHourForParking(
    @Args("parkingId") parkingId: string,
    @Args("userCouponId", { nullable: true }) userCouponId: string
  ) {
    return this.parkingService.calculateParkingFirstHour(
      parkingId,
      userCouponId
    );
  }

}
