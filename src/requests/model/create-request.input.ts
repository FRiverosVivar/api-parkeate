import { ArgsType, Field, InputType } from "@nestjs/graphql";
import { RequestParkingTypeEnum } from "../enum/request-parking-type.enum";
import { Column, Index, Point } from "typeorm";
import { GeometryGQL } from "../../parking/scalar/point.scalar";
import { RequestStatusEnum } from "../enum/request-status.enum";
import { RequestTypeEnum } from "../enum/request-type.enum";

@InputType()
@ArgsType()
export class CreateRequestInput   {
  @Field(() => String)
  fullName: string;
  @Field(() => Number)
  type: RequestTypeEnum;
  @Field(() => Number)
  status: RequestStatusEnum;
  @Field(() => String)
  phoneNumber: string;
  @Field(() => String)
  email: string;
  @Field(() => String)
  state: string;
  @Field(() => String)
  city: string;
  @Field(() => Number, {nullable: true})
  parkingType: RequestParkingTypeEnum;
  @Field(() => String, {nullable: true})
  address: string;
  @Index({ spatial: true })
  @Column({
    type: "geography",
    spatialFeatureType: "Point",
    srid: 4326,
    nullable: true,
  })
  @Field(() => GeometryGQL, {nullable: true})
  location: Point;
  @Field(() => Number, {nullable: true})
  quantity: number;
  @Field(() => String,{nullable: true})
  scheduleStart: string;
  @Field(() => Date,{nullable: true})
  scheduleEnd: Date;
  @Field(() => String,{nullable: true})
  floor: string;
  @Field(() => String,{nullable: true})
  parkingNumber: string;
  @Field(() => Boolean, {nullable: true})
  isOwner: boolean;
  @Field(() => Boolean, {nullable: true})
  isCompany: boolean;
  @Field(() => Boolean, {nullable: true})
  sentCalendar: boolean;
  @Field(() => Boolean, {nullable: true})
  requestState: boolean;
  @Field(() => String, {nullable: true})
  rut: string;
  @Field(() => String, {nullable: true})
  apartmentNumber: string;
}
