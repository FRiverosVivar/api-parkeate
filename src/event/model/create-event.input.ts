import { ArgsType, Field, InputType } from "@nestjs/graphql";
@InputType()
@ArgsType()
export class CreateEventInput {
  @Field(() => String, { nullable: true })
  bannerImage: string;
  @Field(() => String)
  descriptionOfBanner: string;
  @Field(() => String)
  name: string;
  @Field(() => String)
  organizerName: string;
  @Field(() => Date)
  startAt: Date;
  @Field(() => Date)
  endAt: Date;
  @Field(() => Number)
  percentageParkingDiscount: number;
  @Field(() => Number)
  percentageOrganizedProfit: number;
}
