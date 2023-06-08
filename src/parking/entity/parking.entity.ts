import { Field, ObjectType } from "@nestjs/graphql";
import { Column, Entity,  ManyToOne } from "typeorm";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";
import { UserEntity } from "../../user/entity/user.entity";
import { ClientEntity } from "../../client/entity/client.entity";

@Entity('parking')
@ObjectType()
export class ParkingEntity extends BaseEntityWithIdAbstract{
  @Column()
  @Field(() => String)
  name: string
  @Column()
  @Field(() => String)
  address: string
  @Column()
  @Field(() => String)
  coords: string
  @Column()
  @Field(() => String)
  blockedUsers: string
  @Column()
  @Field(() => String)
  tax: number
  @ManyToOne(() => UserEntity, (u) => u.parkingList)
  @Field(() => ClientEntity)
  userOwner: UserEntity
  @ManyToOne(() => ClientEntity, (u) => u.parkingList)
  @Field(() => ClientEntity)
  clientOwner: ClientEntity
}