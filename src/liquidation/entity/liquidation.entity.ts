import { Field, Int, ObjectType } from "@nestjs/graphql";
import { BeforeInsert, Column, Entity, ManyToOne, OneToMany, Unique, UpdateDateColumn } from "typeorm";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";
import { ClientEntity } from "../../client/entity/client.entity";
import { BookingEntity } from "../../booking/entity/booking.entity";
import { LiquidationEnum } from "../model/liquidation.enum";
import { DateTime } from "luxon";
import { getManager } from "typeorm";
import { last } from "lodash";
@Entity('liquidation')
@ObjectType()
export class LiquidationEntity extends BaseEntityWithIdAbstract {
  @BeforeInsert()
  async generateNumberId() {
      const date = DateTime.now().toFormat('ddMMyy')
      const manager = getManager();
      const liquidationRepository = manager.getRepository(LiquidationEntity)
      const lastLiq = await liquidationRepository.findOne({
        select: ['numberId'],
        order: { numberId: 'DESC' },
      })
      const lastNum = lastLiq ? lastLiq.numberId + 1: 1
      this.numberId = parseInt(`${lastNum}${date}`)
  }

  @Column()
  @Field(() => Int)
  numberId: number;
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
  @Column()
  @Field(() => Boolean)
  paid: boolean;
  @Column()
  @Field(() => String)
  liquidationReceipt: string;
  @Column()
  @Field(() => Boolean)
  approved: boolean;
  @Column()
  @Field(() => String)
  approvedBy: string;
  @Column()
  @Field(() => String)
  liquidatedPdf: string;
}
