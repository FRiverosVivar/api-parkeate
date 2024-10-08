import { ArgsType, Field, InputType, ObjectType } from "@nestjs/graphql";
import { BookingEntity } from "../entity/booking.entity";

@InputType()
@ArgsType()
export class PaykuModel {
  @Field(() => String)
  email: string;
  @Field(() => Number, { nullable: true })
  order: number;
  @Field(() => String)
  subject: string;
  @Field(() => Number)
  amount: number;
  @Field(() => String)
  currency: string;
  @Field(() => Number)
  payment: number;
  @Field(() => String)
  expired: string;
  @Field(() => String)
  urlreturn: string;
  @Field(() => String)
  urlnotify: string;
}
@ObjectType()
export class PaykuResponse {
  @Field(() => String)
  status: string;
  @Field(() => String)
  id: string;
  @Field(() => String)
  url: string;
}
