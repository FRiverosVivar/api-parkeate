import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class CurrentPriceBookingOutput {
  @Field(() => Number)
  amountToBePaid: number;
  @Field(() => Number)
  tax: number;
  @Field(() => Number)
  initialPrice: number;
  @Field(() => Number)
  userWalletDiscount: number;
  @Field(() => Number, { nullable: true })
  discount?: number;
}
