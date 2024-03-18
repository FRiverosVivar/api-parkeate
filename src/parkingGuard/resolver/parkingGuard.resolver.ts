import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { ParkingGuardService } from "../service/parkingGuard.service";
import {
  GuardsPaginated,
  PageOptionsDto,
} from "src/utils/interfaces/pagination.type";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ParkingGuardEntity } from "../entity/parkingGuard.entity";

@Resolver()
export class ParkingGuardResolver {
  constructor(private readonly parkingGuardService: ParkingGuardService) {}

  @Query(() => GuardsPaginated, { name: "getPaginatedBuildingGuards" })
  @UseGuards(JwtAuthGuard)
  getPaginatedBuildingGuards(
    @Args("paginationOptions") paginationOptions: PageOptionsDto,
    @Args("buildingId") buildingId: string
  ) {
    return this.parkingGuardService.getPaginatedGuardsFromBuilding(
      buildingId,
      paginationOptions
    );
  }
  @Mutation(() => ParkingGuardEntity)
  @UseGuards(JwtAuthGuard)
  assignGuardToBuilding(
    @Args("buildingId") buildingId: string,
    @Args("guardId") guardId: string
  ) {
    return this.parkingGuardService.assignGuardToBuilding(buildingId, guardId);
  }
  @Mutation(() => ParkingGuardEntity)
  @UseGuards(JwtAuthGuard)
  unassignGuardToBuilding(
    @Args("buildingId") buildingId: string,
    @Args("guardId") guardId: string
  ) {
    return this.parkingGuardService.unassignGuardToBuilding(
      buildingId,
      guardId
    );
  }
  @Query(() => [ParkingGuardEntity], {
    name: "searchGuardsByGivenRutPhoneNumberOrFullname",
  })
  @UseGuards(JwtAuthGuard)
  searchGuardsByGivenRutPhoneNumberOrFullname(
    @Args("text") text: string,
    @Args("restrictedIds", { type: () => [String] }) restrictedIds: string[]
  ) {
    return this.parkingGuardService.searchGuardsByGivenRutPhoneNumberOrFullname(
      text,
      restrictedIds
    );
  }
}
