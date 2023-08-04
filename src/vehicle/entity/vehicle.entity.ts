import { Column, Entity, JoinColumn, ManyToMany, ManyToOne } from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";
import { UserEntity } from "../../user/entity/user.entity";
import { VehicleTypeEnum } from "../model/vehicle-type.enum";

@Entity('vehicle')
@ObjectType()
export class VehicleEntity extends BaseEntityWithIdAbstract {
  @Column()
  @Field(() => String)
  model: string
  @Column()
  @Field(() => String, { description: 'patente'})
  carPlate: string
  @Column()
  @Field(() => String, { description: 'color'})
  color: string
  @Column({nullable: true})
  @Field(() => Int, { description: 'car type', nullable: true})
  carType: VehicleTypeEnum
  @ManyToOne(() => UserEntity, (u) => u.vehicleList)
  @Field(() => UserEntity)
  owner: UserEntity;
}
