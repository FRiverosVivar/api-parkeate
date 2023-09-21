import { ChildEntity, Column, Entity, JoinColumn, JoinTable, ManyToOne, OneToMany } from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";
import { BaseCustomer } from '../../utils/interfaces/base-customer.abstract';
import { ParkingEntity } from "../../parking/entity/parking.entity";
import { HoldingEntity } from "../../holding/entity/holding.entity";
import { BuildingEntity } from "../../building/entity/building.entity";
import { UserTypesEnum } from "../../user/constants/constants";
import { LiquidationEntity } from "../../liquidation/entity/liquidation.entity";
import { LiquidationEnum } from "../../liquidation/model/liquidation.enum";
import { BankAccountTypeEnum, BanksEnum } from "../model/bank.enum";

@Entity('client')
@ObjectType()
export class ClientEntity extends BaseCustomer {
  @Column({ type: 'enum', enum: UserTypesEnum})
  @Field(() => Int, { description: 'type of the user' })
  userType: UserTypesEnum;
  @OneToMany(() => ParkingEntity, (p) => p.client)
  @Field(() => [ParkingEntity])
  parkingList: ParkingEntity[];
  @OneToMany(() => BuildingEntity, (b) => b.client)
  @Field(() => [BuildingEntity])
  buildings: BuildingEntity[];
  @ManyToOne(() => HoldingEntity, (h) => h.clientList, {nullable: true})
  @Field(() => HoldingEntity, {nullable: true})
  holding: HoldingEntity
  @OneToMany(() => LiquidationEntity, (l ) => l.client)
  @Field(() => [LiquidationEntity])
  liquidations: LiquidationEntity[]
  @Column()
  @Field(() => Int)
  preferedLiquidationPayRate: LiquidationEnum
  @Column({nullable: true})
  @Field(() => Int)
  bankType: BanksEnum
  @Column({nullable: true})
  @Field(() => String)
  bankAccountName: string
  @Column({nullable: true})
  @Field(() => Int)
  bankAccountType: BankAccountTypeEnum
  @Column({nullable: true})
  @Field(() => Int)
  bankAccountNumber: number
}
