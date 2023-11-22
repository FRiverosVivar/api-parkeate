import { Field, Int, ObjectType } from "@nestjs/graphql";
import { BaseEntityWithIdAbstract } from "src/utils/interfaces/base-entity-with-id.abstract";
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from "typeorm";
import { CouponsTypeEnum } from "../constants/coupons-type.enum";
import { CouponsBehaviorEnum } from "../constants/coupons-behavior.enum";
import { CouponsUseEnum } from "../constants/coupons-use.enum";
import { UserEntity } from "src/user/entity/user.entity";
import { UserCouponEntity } from "../user-coupons/entity/user-coupons.entity";

@Entity("coupon")
@ObjectType()
export class CouponEntity extends BaseEntityWithIdAbstract {
  @Column()
  @Field(() => String)
  code: string;
  @Column()
  @Field(() => String)
  createdBy: string;
  @Column()
  @Field(() => Int)
  type: CouponsTypeEnum;
  @Column()
  @Field(() => Int)
  behavior: CouponsBehaviorEnum;
  @OneToMany(() => UserCouponEntity, (u) => u.coupon, {
    nullable: true,
    eager: true,
  })
  @Field(() => [UserCouponEntity], { nullable: true })
  assignedUsers: UserCouponEntity[];
  @Column()
  @Field(() => Boolean)
  active: boolean;
  @Column({ type: "timestamptz", nullable: true })
  @Field(() => Date, { nullable: true })
  dateStart: Date;
  @Column({ type: "timestamptz", nullable: true })
  @Field(() => Date, { nullable: true })
  dateEnd: Date;
  @Column({ nullable: true })
  @Field(() => Int, { nullable: true })
  useTimes: number;
  @Column()
  @Field(() => Boolean)
  global: boolean;
  @Column({ default: 0 })
  @Field(() => Int)
  value: number;
}
