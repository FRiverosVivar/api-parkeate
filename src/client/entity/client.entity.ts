import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Unique,
} from "typeorm";
import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import { BaseCustomer } from "../../utils/interfaces/base-customer.abstract";
import { ParkingEntity } from "../../parking/entity/parking.entity";
import { HoldingEntity } from "../../holding/entity/holding.entity";
import { BuildingEntity } from "../../building/entity/building.entity";
import { UserTypesEnum } from "../../user/constants/constants";
import { LiquidationEntity } from "../../liquidation/entity/liquidation.entity";
import { LiquidationEnum } from "../../liquidation/model/liquidation.enum";
import { BankAccountTypeEnum, BanksEnum } from "../model/bank.enum";

@ObjectType()
@Entity("client")
@Unique("ClientRutEmailPhone", ["rut", "email", "phoneNumber"])
export class ClientEntity extends BaseCustomer {
  @Column({ type: "enum", enum: UserTypesEnum })
  @Field(() => Int, { description: "type of the user" })
  userType: UserTypesEnum;
  @OneToMany(() => ParkingEntity, (p) => p.client, {onDelete: "CASCADE"})
  @Field(() => [ParkingEntity])
  parkingList: ParkingEntity[];
  @OneToMany(() => BuildingEntity, (b) => b.client, {onDelete: "SET NULL"})
  @Field(() => [BuildingEntity])
  buildings: BuildingEntity[];
  @ManyToOne(() => HoldingEntity, (h) => h.clientList, { nullable: true, onDelete: "CASCADE" })
  @Field(() => HoldingEntity, { nullable: true })
  holding: HoldingEntity;
  @OneToMany(() => LiquidationEntity, (l) => l.client, {onDelete: "SET NULL"})
  @Field(() => [LiquidationEntity])
  liquidations: LiquidationEntity[];
  @Column({ default: LiquidationEnum.BIWEEKLY15 })
  @Field(() => Int)
  preferedLiquidationPayRate: LiquidationEnum;
  @Column({ nullable: true })
  @Field(() => Int, { nullable: true })
  bankType: BanksEnum;
  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  bankAccountName: string;
  @Column({ nullable: true })
  @Field(() => Int, { nullable: true })
  bankAccountType: BankAccountTypeEnum;
  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  bankAccountNumber: string;
  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  bankAccountEmail: string;
  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  supplier: boolean;
}
