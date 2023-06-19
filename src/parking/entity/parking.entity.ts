import { Field, ObjectType } from "@nestjs/graphql";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from "typeorm";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";
import { UserEntity } from "../../user/entity/user.entity";
import { ClientEntity } from "../../client/entity/client.entity";
import { ScheduleEntity } from "../../schedule/entity/schedule.entity";
import { BuildingEntity } from "../../building/entity/building.entity";
import { TagsEntity } from "../../tags/entity/tags.entity";
import { BookingEntity } from "../../booking/entity/booking.entity";

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
  @Column()
  @Field(() => String)
  coords: string
  @Column()
  @Field(() => String)
  buildingPositionCode: string
  @Column()
  @Field(() => String)
  photo: string
  @ManyToMany(() => UserEntity, (u) => u.restrictedParkings, {eager: true})
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
  tax: number
  @Column()
  @Field(() => String)
  pricePerMinute: number
  @Column()
  @Field(() => String)
  priceMonthly: number
  @Column()
  @Field(() => String)
  priceYearly: number
  @ManyToOne(() => UserEntity, (u) => u.parkingList, {eager: true})
  @JoinColumn([
    { name: "userId", referencedColumnName: "id" }]
  )
  @Field(() => ClientEntity)
  userOwner: UserEntity
  @ManyToOne(() => ClientEntity, (c) => c.parkingList, {eager: true})
  @JoinColumn([
    { name: "clientId", referencedColumnName: "id" }]
  )
  @Field(() => ClientEntity)
  clientOwner: ClientEntity
  @OneToMany(() => ScheduleEntity, (p) => p.parking)
  @Field(() => [ScheduleEntity])
  schedule: ScheduleEntity[];
  @ManyToOne(() => BuildingEntity, (b) => b.parkingList, {eager: true})
  @Field(() => BuildingEntity)
  building: BuildingEntity
  @ManyToMany(() => TagsEntity, (t) => t.parkings, {eager: true})
  @Field(() => [TagsEntity])
  tags: TagsEntity[]
  @OneToMany(() => BookingEntity, (b) => b.parking)
  @Field(() => [BookingEntity])
  bookings: BookingEntity[]
}
