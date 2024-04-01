import { Field, Int, ObjectType } from "@nestjs/graphql";
import { BuildingEntity } from "src/building/entity/building.entity";
import { UserTypesEnum } from "src/user/constants/constants";
import { BaseCustomer } from "src/utils/interfaces/base-customer.abstract";
import { Column, Entity, JoinTable, ManyToMany } from "typeorm";

@Entity("parkingGuard")
@ObjectType()
export class ParkingGuardEntity extends BaseCustomer {
  @Column({ type: "enum", enum: UserTypesEnum })
  @Field(() => Int, { description: "type of the user" })
  userType: UserTypesEnum;
  @ManyToMany(() => BuildingEntity, (b) => b.guardsAssigned, { nullable: true })
  @JoinTable({
    name: "guards_and_buildings",
    joinColumn: {
      name: "guardId",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "buildingId",
      referencedColumnName: "id",
    },
  })
  @Field(() => [BuildingEntity])
  guardBuildings: BuildingEntity[];
}
