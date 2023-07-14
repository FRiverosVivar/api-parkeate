import { Column, Entity, JoinColumn, ManyToMany, ManyToOne } from "typeorm";
import { Field, ObjectType } from "@nestjs/graphql";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";
import { UserEntity } from "../../user/entity/user.entity";

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
  @ManyToOne(() => UserEntity, (u) => u.vehicleList)
  @Field(() => UserEntity)
  owner: UserEntity;
}
