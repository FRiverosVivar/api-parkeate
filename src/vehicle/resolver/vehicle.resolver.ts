import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { VehicleEntity } from "../entity/vehicle.entity";
import { VehicleService } from "../service/vehicle.service";
import { UpdateVehicleInput } from "../model/update-vehicle.input";
import { CreateVehicleInput } from "../model/create-vehicle.input";
import { UserService } from "../../user/service/user.service";
import { map } from "rxjs";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UserTypeGuard } from "../../auth/guards/user-type.guard";
import { CurrentUser } from "../../auth/decorator/current-user.decorator";
import { UserEntity } from "../../user/entity/user.entity";

@Resolver(VehicleEntity)
@UseGuards(JwtAuthGuard)
export class VehicleResolver {
  constructor(private readonly vehicleService: VehicleService) {}
  @Mutation(() => VehicleEntity)
  createVehicle(
    @Args("createVehicleInput") createVehicleInput: CreateVehicleInput,
    @Args("ownerId") ownerId: string
  ) {
    return this.vehicleService.createVehicle(createVehicleInput, ownerId);
  }
  @Query(() => VehicleEntity, { name: "findVehicleById" })
  findVehicleById(
    @Args("vehicleId", { type: () => String }) vehicleId: string
  ) {
    return this.vehicleService.findVehicleById(vehicleId);
  }
  @Mutation(() => VehicleEntity)
  updateVehicle(
    @Args("updateVehicleInput") updateVehicleInput: UpdateVehicleInput
  ) {
    return this.vehicleService.updateVehicle(updateVehicleInput);
  }
  @Mutation(() => VehicleEntity)
  removeVehicle(@Args("vehicleId") vehicleId: string) {
    return this.vehicleService.removeVehicle(vehicleId);
  }
  @Query(() => [VehicleEntity], { name: "findVehiclesByUserId" })
  findVehiclesByUserId(@CurrentUser() user: UserEntity) {
    return this.vehicleService.findVehiclesByUserId(user.id);
  }
  @Query(() => [VehicleEntity], { name: "findVehiclesWithModelPlateOrOwner" })
  findVehiclesWithModelPlateOrOwner(
    @Args("text", { type: () => String }) text: string
  ) {
    return this.vehicleService.findVehiclesWithModelPlateOrOwner(text);
  }
}
