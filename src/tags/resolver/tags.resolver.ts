import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { TagsEntity } from "../entity/tags.entity";
import { TagsService } from "../service/tags.service";
import { VehicleEntity } from "../../vehicle/entity/vehicle.entity";
import { UpdateVehicleInput } from "../../vehicle/model/update-vehicle.input";
import { CreateTagInput } from "../model/create-tag.input";
import { UseGuards } from "@nestjs/common";
import { UserType } from "../../auth/decorator/user-type.decorator";
import { UserTypesEnum } from "../../user/constants/constants";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UserTypeGuard } from "../../auth/guards/user-type.guard";
import { UpdateTagInput } from "../model/update-tag.input";
@UserType(UserTypesEnum.ADMIN)
@Resolver(TagsEntity)
@UseGuards(JwtAuthGuard, UserTypeGuard)
export class TagsResolver {
  constructor(private readonly tagsService: TagsService) {}

  @Mutation(() => TagsEntity)
  createTag(@Args('createTagInput') createTagInput: CreateTagInput) {
    return this.tagsService.createTag(createTagInput);
  }
  @Query(() => [TagsEntity], { name: 'findTagById' })
  findTagById(@Args('tagId', { type: () => String }) tagId: string) {
    return this.tagsService.findTagById(tagId);
  }
  @Query(() => [TagsEntity], { name: 'findTagsByParkingId' })
  findTagsByParkingId(@Args('parkingId', { type: () => String }) parkingId: string) {
    return this.tagsService.findTagsByParkingId(parkingId);
  }
  @Mutation(() => TagsEntity)
  updateTag(
    @Args('updateTagInput') updateTagInput: UpdateTagInput,
  ) {
    return this.tagsService.updateTag(updateTagInput);
  }
  @Mutation(() => TagsEntity)
  removeTag(@Args('tagId') tagId: string) {
    return this.tagsService.removeTag(tagId);
  }

}