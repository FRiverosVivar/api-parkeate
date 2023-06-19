import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { BuildingEntity } from "../entity/building.entity";
import { BuildingService } from "../service/building.service";
import { CreateBuildingInput } from "../model/create-building.input";
import { UpdateBuildingInput } from "../model/update-building.input";

@Resolver(BuildingEntity)
export class BuildingResolver {
  constructor(private buildingService: BuildingService) {}

  @Mutation(() => BuildingEntity)
  createBuilding(
    @Args('createBuildingEntity') createBuildingEntity: CreateBuildingInput,
    @Args('ownerId') ownerId: string
  ) {
    return this.buildingService.createBuilding(createBuildingEntity, ownerId);
  }
  @Query(() => BuildingEntity, { name: 'findBuildingById' })
  findBuildingById(@Args('buildingId', { type: () => String }) buildingId: string) {
    return this.buildingService.findBuildingById(buildingId);
  }
  @Query(() => BuildingEntity, { name: 'findBuildingByAddress' })
  findBuildingByAddress(@Args('buildingId', { type: () => String }) buildingId: string) {
    return this.buildingService.findBuildingByAddress(buildingId);
  }
  @Mutation(() => BuildingEntity)
  updateBuilding(
    @Args('updateBuildingInput') updateBuildingInput: UpdateBuildingInput,
  ) {
    return this.buildingService.updateBuilding(updateBuildingInput);
  }
  @Mutation(() => BuildingEntity)
  removeTag(@Args('buildingId') buildingId: string) {
    return this.buildingService.removeBuilding(buildingId);
  }
}