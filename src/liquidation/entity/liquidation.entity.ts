import { Field, Int, ObjectType } from "@nestjs/graphql";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";
import { ClientEntity } from "../../client/entity/client.entity";
import { BookingEntity } from "../../booking/entity/booking.entity";
import { LiquidationEnum } from "../model/liquidation.enum";

@Entity('liquidation')
@ObjectType()
export class LiquidationEntity extends BaseEntityWithIdAbstract {
  @ManyToOne(() => ClientEntity, (c) => c.liquidations)
  @Field(() => ClientEntity)
  client: ClientEntity;
  @OneToMany(() => BookingEntity, (b) => b.liquidation)
  @Field(() => [BookingEntity])
  bookings: BookingEntity[];
  @Column()
  @Field(() => Number)
  priceToBeLiquidated: number;
  @Column()
  @Field(() => String)
  liquidatedBy: string;
  @Column()
  @Field(() => Int)
  liquidationType: LiquidationEnum;
}
