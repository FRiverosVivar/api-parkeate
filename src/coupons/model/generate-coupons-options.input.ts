import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { CreateCouponInput } from "./create-coupon.input";

@InputType()
export class GenerateCouponOptions {
  @Field(() => String)
  prefix: string;
  @Field(() => String)
  postfix: string;
  @Field(() => Int)
  length: number;
  @Field(() => String)
  characters: string;
  @Field(() => Int)
  quantity: number;
  @Field(() => CreateCouponInput)
  couponInput: CreateCouponInput;
}
