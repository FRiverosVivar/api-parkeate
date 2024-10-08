import { ArgsType, Field, InputType, PartialType } from "@nestjs/graphql";
import { CreateCouponInput } from "./create-coupon.input";

@InputType()
@ArgsType()
export class UpdateCouponInput extends PartialType(CreateCouponInput) {
  @Field(() => String)
  id: string;
}
