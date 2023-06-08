import { HoldingEntity } from "../entity/holding.entity";
import { HoldingService } from "../service/holding.service";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UserEntity } from "../../user/entity/user.entity";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UpdateHoldingInput } from "../model/update-holding.input";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";
import { Observable } from "rxjs";
import { UserType } from "../../auth/decorator/user-type.decorator";
import { UserTypesEnum } from "../../user/constants/constants";
import { UserTypeGuard } from "../../auth/guards/user-type.guard";
import { CreatePhotoInput } from "../../photo/model/create-photo.input";

@Resolver(() => HoldingEntity)
export class HoldingResolver {
  constructor(private readonly holdingService: HoldingService) {
  }
  @Query(() => [HoldingEntity], { name: 'getAllHoldings' })
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  findAllHoldings() {
    return this.holdingService.findAll();
  }
  @Query(() => HoldingEntity, { name: 'getHoldingById' })
  @UserType(UserTypesEnum.USER)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  findOneHoldingById(@Args('holdingId', { type: () => String }) holdingId: string) {
    return this.holdingService.findHoldingById(holdingId);
  }
  @Mutation(() => HoldingEntity, { name: 'updateHolding' })
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  updateHolding(@Args('updateHoldingInput') updateHoldingInput: UpdateHoldingInput) {
    return this.holdingService.updateHolding(updateHoldingInput);
  }
  @Mutation(() => HoldingEntity, { name: 'setHoldingPhoto' })
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(UserTypeGuard)
  setHoldingPhoto(
    @Args('holdingId', { type: () => String }) holdingId: string,
    @Args('photoInput', { type: () => CreatePhotoInput }) photoInput: CreatePhotoInput,
    @Args('photo', { type: () => GraphQLUpload }) photo: FileUpload,
  ): Observable<HoldingEntity> {
    return this.holdingService.setProfilePhoto(holdingId, photo, photoInput);
  }
  @Mutation(() => UserEntity, { name: 'removeHolding' })
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  removeHolding(@Args('holdingId', { type: () => String }) holdingId: string) {
    return this.holdingService.removeHolding(holdingId);
  }
}