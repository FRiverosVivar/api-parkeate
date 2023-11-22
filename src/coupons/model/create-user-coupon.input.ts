import { ArgsType, Field, InputType, Int } from "@nestjs/graphql";

@InputType()
@ArgsType()
export class CraeteUserCouponInput {
  @Field(() => Int)
  quantityRemaining: number;
  @Field(() => Boolean)
  valid: boolean;
}
