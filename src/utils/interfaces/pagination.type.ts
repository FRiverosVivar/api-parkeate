import { ArgsType, Field, InputType, ObjectType } from "@nestjs/graphql";
import { Any } from "typeorm";
import { BuildingEntity } from "../../building/entity/building.entity";
import { ParkingEntity } from "../../parking/entity/parking.entity";
import { UserEntity } from "../../user/entity/user.entity";
import { BookingEntity } from "../../booking/entity/booking.entity";
import { LiquidationEntity } from "src/liquidation/entity/liquidation.entity";
import { CouponEntity } from "src/coupons/entity/coupon.entity";
@InputType()
@ArgsType()
export class PageOptionsDto {
  @Field(() => Number)
  page?: number = 1;
  @Field(() => Number)
  take?: number = 10;
  @Field(() => Number)
  skip?: number = 0;
}

export class PageDto<T> {
  data: T[];
  meta: PaginationMeta;

  constructor(data: T[], meta: PaginationMeta) {
    this.data = data;
    this.meta = meta;
  }
}

export interface PageMetaDtoParameters {
  pageOptionsDto: PageOptionsDto;
  itemCount: number;
}

@ObjectType()
export class PaginationMeta {
  @Field(() => Number)
  page: number;
  @Field(() => Number)
  skip: number;
  @Field(() => Number)
  take: number;
  @Field(() => Number)
  itemCount: number;
  @Field(() => Number)
  pageCount: number;
  @Field(() => Boolean)
  hasPreviousPage: boolean;
  @Field(() => Boolean)
  hasNextPage: boolean;
  constructor({ pageOptionsDto, itemCount }: PageMetaDtoParameters) {
    this.page = pageOptionsDto.page!;
    this.take = pageOptionsDto.take!;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(this.itemCount / this.take);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.pageCount;
  }
}
@ObjectType()
export class BuildingsPaginated {
  @Field(() => [BuildingEntity])
  data: BuildingEntity[];
  @Field(() => PaginationMeta)
  meta: PaginationMeta;
}
@ObjectType()
export class ParkingsPaginated {
  @Field(() => [ParkingEntity])
  data: ParkingEntity[];
  @Field(() => PaginationMeta)
  meta: PaginationMeta;
}
@ObjectType()
export class BookingsPaginated {
  @Field(() => [BookingEntity])
  data: BookingEntity[];
  @Field(() => PaginationMeta)
  meta: PaginationMeta;
}
@ObjectType()
export class ParkingBlockedUsersPaginated {
  @Field(() => [UserEntity])
  data: UserEntity[];
  @Field(() => PaginationMeta)
  meta: PaginationMeta;
}
@ObjectType()
export class ParkingCouponAssignedUsersPaginated {
  @Field(() => [UserEntity])
  data: UserEntity[];
  @Field(() => PaginationMeta)
  meta: PaginationMeta;
}
@ObjectType()
export class LiquidationsPaginated {
  @Field(() => [LiquidationEntity])
  data: LiquidationEntity[];
  @Field(() => PaginationMeta)
  meta: PaginationMeta;
}
@ObjectType()
export class CouponsPaginated {
  @Field(() => [CouponEntity])
  data: CouponEntity[];
  @Field(() => PaginationMeta)
  meta: PaginationMeta;
}
