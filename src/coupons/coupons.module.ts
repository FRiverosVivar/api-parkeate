import { registerEnumType } from "@nestjs/graphql";
import { CouponsTypeEnum } from "./constants/coupons-type.enum";
import { CouponsBehaviorEnum } from "./constants/coupons-behavior.enum";
import { CouponsUseEnum } from "./constants/coupons-use.enum";
import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CouponService } from "./service/coupon.service";
import { CouponEntity } from "./entity/coupon.entity";
import { CouponResolver } from "./resolver/coupon.resolver";
import { UserCouponEntity } from "./user-coupons/entity/user-coupons.entity";

registerEnumType(CouponsTypeEnum, {
  name: "CouponsTypeEnum",
});
registerEnumType(CouponsBehaviorEnum, {
  name: "CouponsBehaviorEnum",
});
registerEnumType(CouponsUseEnum, {
  name: "CouponsUseEnum",
});
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([CouponEntity, UserCouponEntity])],
  providers: [CouponService, CouponResolver],
  exports: [CouponService, CouponResolver],
})
export class CouponModule {}
