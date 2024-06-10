import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Point,
} from "typeorm";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";
import { UserEntity } from "../../user/entity/user.entity";
import { ClientEntity } from "../../client/entity/client.entity";
import { ScheduleEntity } from "../../schedule/entity/schedule.entity";
import { BuildingEntity } from "../../building/entity/building.entity";
import { TagsEntity } from "../../tags/entity/tags.entity";
import { BookingEntity } from "../../booking/entity/booking.entity";
import { GeometryGQL } from "../scalar/point.scalar";
import { Geometry } from "geojson";
import { ParkingType } from "../model/parking-type.enum";
import { EventEntity } from "src/event/entity/event.entity";

@Entity("parking")
@ObjectType()
export class ParkingEntity extends BaseEntityWithIdAbstract {
  @Column()
  @Field(() => Boolean)
  active: boolean;
  @Column()
  @Field(() => Boolean)
  reserved: boolean;
  @Column()
  @Field(() => String)
  name: string;
  @Column()
  @Field(() => Boolean)
  blocked: boolean;
  @Column()
  @Field(() => String)
  address: string;
  @Column()
  @Field(() => Int)
  floor: number;
  @Column()
  @Field(() => String)
  section: string;
  @Column()
  @Field(() => String)
  code: string;
  @Column()
  @Field(() => Int)
  type: ParkingType;
  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  photo: string;
  @ManyToMany(() => UserEntity, (u) => u.restrictedParkings)
  @JoinTable({
    name: "blocked_user_parkings",
    joinColumn: {
      name: "parkingId",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "userId",
      referencedColumnName: "id",
    },
  })
  @Field(() => [UserEntity])
  blockedUsers: UserEntity[];
  @Column()
  @Field(() => String)
  tax: string;
  @Column()
  @Field(() => String)
  pricePerMinute: string;
  @Column()
  @Field(() => String)
  priceMonthly: string;
  @Column()
  @Field(() => String)
  priceYearly: string;
  @ManyToOne(() => ClientEntity, (c) => c.parkingList, { eager: true })
  @Field(() => ClientEntity)
  client: ClientEntity;
  @OneToMany(() => ScheduleEntity, (p) => p.parking, {
    eager: true,
    nullable: true,
  })
  @Field(() => [ScheduleEntity])
  schedule?: ScheduleEntity[];
  @ManyToOne(() => BuildingEntity, (b) => b.parkingList, {
    onDelete: "CASCADE"})
  @Field(() => BuildingEntity)
  building: BuildingEntity;
  @OneToMany(() => BookingEntity, (b) => b.parking, {onDelete: "SET NULL"})
  @Field(() => [BookingEntity])
  bookings: BookingEntity[];
  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  phone: string;
  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  contactEmail: string;
  @Column({ nullable: true, default: false })
  @Field(() => Boolean, { nullable: true })
  canBookAnticipated: boolean;
  @Column({ nullable: true, default: 100 })
  @Field(() => Number, { nullable: true })
  percentageSurchargeForReservation: number;
  @ManyToOne(() => ParkingEntity, (p) => p.event, {
    nullable: true,
  })
  @Field(() => EventEntity, { nullable: true })
  event: EventEntity;
}
