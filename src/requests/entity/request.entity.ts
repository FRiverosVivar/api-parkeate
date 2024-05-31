import { Column, Entity, Index, Point } from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";
import { RequestParkingTypeEnum } from "../enum/request-parking-type.enum";
import { GeometryGQL } from "../../parking/scalar/point.scalar";
import { RequestStatusEnum } from "../enum/request-status.enum";
import { RequestTypeEnum } from "../enum/request-type.enum";

@Entity("request")
@ObjectType()
export class RequestEntity extends BaseEntityWithIdAbstract {
  @Column()
  @Field(() => String)
  fullName: string;
  @Column()
  @Field(() => Number)
  type: RequestTypeEnum;
  @Column()
  @Field(() => Number)
  status: RequestStatusEnum;
  @Column()
  @Field(() => String)
  phoneNumber: string;
  @Column()
  @Field(() => String)
  email: string;
  @Column()
  @Field(() => String)
  state: string;
  @Column()
  @Field(() => String)
  city: string;
  @Column({nullable: true})
  @Field(() => Number)
  parkingType: RequestParkingTypeEnum;
  @Column({nullable: true})
  @Field(() => String)
  address: string;
  @Index({ spatial: true })
  @Column({
    type: "geography",
    spatialFeatureType: "Point",
    srid: 4326,
    nullable: true,
  })
  @Field(() => GeometryGQL)
  location: Point;
  @Column({nullable: true})
  @Field(() => Number)
  quantity: number;
  @Column({nullable: true})
  @Field(() => String, {nullable: true})
  scheduleStart: string;
  @Column({nullable: true})
  @Field(() => Date, {nullable: true})
  scheduleEnd: Date;
  @Column({nullable: true})
  @Field(() => String)
  floor: string;
  @Column({nullable: true})
  @Field(() => String)
  parkingNumber: string;
  @Column({nullable: true})
  @Field(() => Boolean)
  isOwner: boolean;
  @Column({nullable: true})
  @Field(() => Boolean)
  isCompany: boolean;
  @Column({nullable: true})
  @Field(() => Boolean)
  sentCalendar: boolean;
  @Column({nullable: true})
  @Field(() => String)
  rut: string;
  @Column({nullable: true})
  @Field(() => String)
  apartmentNumber: string;
  @Column({nullable: true})
  @Field(() => String)
  parkingPhoto: string;
}
