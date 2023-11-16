import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CouponService } from "../service/coupon.service";
import { CouponEntity } from "../entity/coupon.entity";
import { UseGuards } from "@nestjs/common";
import { GenerateCouponOptions } from "../model/generate-coupons-options.input";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UserTypeGuard } from "src/auth/guards/user-type.guard";
import { UserTypesEnum } from "src/user/constants/constants";
import { UserType } from "src/auth/decorator/user-type.decorator";
import { UpdateCouponInput } from "../model/update-coupon.input";
import {
  CouponsPaginated,
  PageOptionsDto,
} from "src/utils/interfaces/pagination.type";
import { Observable, from } from "rxjs";
import { UserCouponEntity } from "../user-coupons/entity/user-coupons.entity";
import { UpdateUserCouponInput } from "../model/update-user-coupon.input";
import { CurrentUser } from "src/auth/decorator/current-user.decorator";
import { UserEntity } from "src/user/entity/user.entity";

@Resolver()
export class CouponResolver {
  constructor(private readonly couponService: CouponService) {}
  @Mutation(() => [CouponEntity])
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  generateBulkOfCodes(
    @Args("generateCouponsOptions")
    generateCouponsOptions: GenerateCouponOptions
  ) {
    return this.couponService.generateCoupons(generateCouponsOptions);
  }
  @Mutation(() => CouponEntity)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  assignCouponToUser(
    @Args("userId") userId: string,
    @Args("couponId") couponId: string
  ) {
    return this.couponService.assignCouponToUser(userId, couponId);
  }
  @Mutation(() => CouponEntity)
  @UseGuards(JwtAuthGuard)
  updateCoupon(
    @Args("updateCouponInput") updateCouponInput: UpdateCouponInput
  ) {
    return this.couponService.updateCoupon(updateCouponInput);
  }
  @Mutation(() => CouponEntity)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  deleteCoupon(@Args("id") id: string) {
    return this.couponService.deleteCoupon(id);
  }
  @Query(() => CouponsPaginated, { name: "getPaginatedCoupons" })
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  getPaginatedCoupons(
    @Args("paginationOptions") paginationOptions: PageOptionsDto
  ) {
    return this.couponService.findPaginatedCoupons(paginationOptions);
  }
  @Mutation(() => UserCouponEntity)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  removeAssignedUserFromCoupon(
    @Args("userCouponId") userCouponId: string
  ): Observable<UserCouponEntity> {
    return from(this.couponService.removeAssignedUserFromCoupon(userCouponId));
  }
  @Mutation(() => UserCouponEntity)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  updateUserCoupon(
    @Args("updateUserCouponInput") updateUserCouponInput: UpdateUserCouponInput
  ): Observable<UserCouponEntity> {
    return from(this.couponService.updateUserCoupon(updateUserCouponInput));
  }
  @Mutation(() => UserCouponEntity, { nullable: true })
  @UseGuards(JwtAuthGuard)
  verifyIfCouponExistsAndThenAssignToUser(
    @Args("couponText") couponText: string,
    @CurrentUser() user: UserEntity
  ) {
    return this.couponService.verifyIfCouponExistsAndThenAssignToUser(
      user,
      couponText
    );
  }
  @Query(() => [UserCouponEntity])
  @UseGuards(JwtAuthGuard)
  getUserCoupons(@CurrentUser() user: UserEntity) {
    return this.couponService.getUserCoupons(user);
  }
}
