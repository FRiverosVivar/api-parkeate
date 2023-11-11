import { ArgsType, Field, InputType, PartialType } from "@nestjs/graphql";
import { CraeteUserCouponInput } from "./create-user-coupon.input";
@InputType()
@ArgsType()
export class UpdateUserCouponInput extends PartialType(CraeteUserCouponInput) {
  @Field(() => String)
  id: string;
}
