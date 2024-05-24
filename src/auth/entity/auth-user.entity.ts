import { Field, Int, ObjectType } from "@nestjs/graphql";
import { Column, Entity, Unique } from "typeorm";
import { BaseCustomer } from "../../utils/interfaces/base-customer.abstract";
import { UserTypesEnum } from "../../user/constants/constants";
import { LiquidationEnum } from "../../liquidation/model/liquidation.enum";
import { BankAccountTypeEnum, BanksEnum } from "../../client/model/bank.enum";

@ObjectType()
@Entity("auth-user")
export class AuthUserEntity extends BaseCustomer {
  @Column({ type: "enum", enum: UserTypesEnum })
  @Field(() => UserTypesEnum, { description: "type of the user" })
  userType: UserTypesEnum;
  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  paykuClientId: string;
  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  paykuSubId: string;
  @Column({ nullable: true })
  @Field(() => Int)
  wallet: number;
  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  licenseDriver: string;
  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  dniPhoto: string;
  @Column({ default: LiquidationEnum.BIWEEKLY15 })
  @Field(() => Int)
  preferedLiquidationPayRate: LiquidationEnum;
  @Column({ nullable: true })
  @Field(() => Int, { nullable: true })
  bankType: BanksEnum;
  @Column({ nullable: true })
  @Field(() => String)
  bankAccountName: string;
  @Column({ nullable: true })
  @Field(() => Int)
  bankAccountType: BankAccountTypeEnum;
  @Column({ nullable: true })
  @Field(() => String)
  bankAccountNumber: string;
  @Column({ nullable: true })
  @Field(() => String)
  bankAccountEmail: string;
  @Column({ nullable: true })
  @Field(() => String)
  dataId: string;
}