import { Field, ObjectType } from "@nestjs/graphql";
import { ParkingEntity } from "src/parking/entity/parking.entity";
import { BaseEntityWithIdAbstract } from "src/utils/interfaces/base-entity-with-id.abstract";
import { Column, Entity, OneToMany } from "typeorm";

@Entity("event")
@ObjectType()
export class EventEntity extends BaseEntityWithIdAbstract {
  @Column()
  @Field(() => Boolean)
  active: boolean;
  @Column()
  @Field(() => String)
  code: string;
  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  bannerImage: string;
  @Column()
  @Field(() => String)
  descriptionOfBanner: string;
  @Column()
  @Field(() => String)
  name: string;
  @Column()
  @Field(() => String)
  organizerName: string;
  @Column()
  @Field(() => Date)
  startAt: Date;
  @Column()
  @Field(() => Date)
  endAt: Date;
  @Column()
  @Field(() => Number)
  percentageParkingDiscount: number;
  @Column()
  @Field(() => Number)
  percentageOrganizedProfit: number;
  @OneToMany(() => ParkingEntity, (p) => p.event, {
    nullable: true,
    eager: true,
  })
  @Field(() => [ParkingEntity], { nullable: true })
  parkings: ParkingEntity[];
}
