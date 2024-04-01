import { ArgsType, Field, InputType, Int } from "@nestjs/graphql";
import { CouponsTypeEnum } from "../constants/coupons-type.enum";
import { CouponsBehaviorEnum } from "../constants/coupons-behavior.enum";
import { CouponsUseEnum } from "../constants/coupons-use.enum";

@InputType()
@ArgsType()
export class CreateCouponInput {
  @Field(() => String, { nullable: true })
  code: string;
  @Field(() => String)
  createdBy: string;
  @Field(() => Int)
  type: CouponsTypeEnum;
  @Field(() => Int)
  behavior: CouponsBehaviorEnum;
  // @Field(() => [String])
  // assignedUsers: string[]
  @Field(() => Boolean)
  active: boolean;
  @Field(() => Date, { nullable: true })
  dateStart: Date;
  @Field(() => Date, { nullable: true })
  dateEnd: Date;
  @Field(() => Int, { nullable: true })
  useTimes: number;
  @Field(() => Boolean)
  global: boolean;
  @Field(() => Int)
  value: number;
}