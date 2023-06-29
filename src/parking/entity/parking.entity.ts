import { Field, Float, ObjectType } from "@nestjs/graphql";
import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, Point } from "typeorm";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";
import { UserEntity } from "../../user/entity/user.entity";
import { ClientEntity } from "../../client/entity/client.entity";
import { ScheduleEntity } from "../../schedule/entity/schedule.entity";
import { BuildingEntity } from "../../building/entity/building.entity";
import { TagsEntity } from "../../tags/entity/tags.entity";
import { BookingEntity } from "../../booking/entity/booking.entity";
import { GeometryGQL } from "../scalar/point.scalar";
import { Geometry } from "geojson";

@Entity('parking')
@ObjectType()
export class ParkingEntity extends BaseEntityWithIdAbstract{
  @Column({default: false})
  @Field(() => Boolean)
  active: boolean
  @Column({default: false})
  @Field(() => Boolean)
  reserved: boolean
  @Column()
  @Field(() => String)
  name: string
  @Column()
  @Field(() => Boolean)
  blocked: boolean
  @Column()
  @Field(() => String)
  address: string
  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  @Field(() => GeometryGQL)
  location: Point
  @Column()
  @Field(() => String)
  buildingPositionCode: string
  @Column()
  @Field(() => String)
  photo: string
  @ManyToMany(() => UserEntity, (u) => u.restrictedParkings)
  @JoinTable(
    {
      name: 'blocked_user_parkings',
      joinColumn: {
        name: "userId",
        referencedColumnName: "id"
      },
      inverseJoinColumn: {
        name: "parkingId",
        referencedColumnName: "id"
      }
    }
  )
  @Field(() =>[UserEntity])
  blockedUsers: UserEntity[]
  @Column()
  @Field(() => String)
  tax: string
  @Column()
  @Field(() => String)
  pricePerMinute: string
  @Column()
  @Field(() => String)
  priceMonthly: string
  @Column()
  @Field(() => String)
  priceYearly: string
  @ManyToOne(() => UserEntity, (u) => u.parkingList, {eager: true, nullable: true})
  @JoinColumn([
    { name: "userId", referencedColumnName: "id" }]
  )
  @Field(() => UserEntity, {nullable: true})
  userOwner: UserEntity
  @ManyToOne(() => ClientEntity, (c) => c.parkingList, {eager: true, nullable: true})
  @JoinColumn([
    { name: "clientId", referencedColumnName: "id" }]
  )
  @Field(() => ClientEntity, {nullable: true})
  clientOwner: ClientEntity
  @OneToMany(() => ScheduleEntity, (p) => p.parking)
  @Field(() => [ScheduleEntity])
  schedule: ScheduleEntity[];
  @ManyToOne(() => BuildingEntity, (b) => b.parkingList, {eager: true})
  @Field(() => BuildingEntity)
  building: BuildingEntity
  @ManyToMany(() => TagsEntity, (t) => t.parkings, {eager: true, nullable: true})
  @Field(() => [TagsEntity])
  tags: TagsEntity[]
  @OneToMany(() => BookingEntity, (b) => b.parking)
  @Field(() => [BookingEntity])
  bookings: BookingEntity[]
}
