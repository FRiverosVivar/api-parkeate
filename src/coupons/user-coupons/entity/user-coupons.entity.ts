import { Field, Int, ObjectType } from "@nestjs/graphql";
import { BookingEntity } from "src/booking/entity/booking.entity";
import { CouponEntity } from "src/coupons/entity/coupon.entity";
import { UserEntity } from "src/user/entity/user.entity";
import { BaseEntityWithIdAbstract } from "src/utils/interfaces/base-entity-with-id.abstract";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity("user-coupon")
@ObjectType()
export class UserCouponEntity extends BaseEntityWithIdAbstract {
  @ManyToOne(() => UserEntity, (u) => u.userCoupons, { nullable: true })
  @Field(() => UserEntity)
  user: UserEntity;
  @ManyToOne(() => CouponEntity, (c) => c.assignedUsers, { nullable: true })
  @Field(() => CouponEntity)
  coupon: CouponEntity;
  @ManyToOne(() => BookingEntity, (b) => b.coupon, { nullable: true })
  @Field(() => BookingEntity)
  booking: BookingEntity;
  @Column()
  @Field(() => Int)
  quantityRemaining: number;
  @Column()
  @Field(() => Boolean)
  valid: boolean;
}
