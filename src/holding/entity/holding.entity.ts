import { Column, Entity, OneToMany } from "typeorm";
import { Field, ObjectType } from "@nestjs/graphql";
import { BasicProfileAbstract } from "../../utils/interfaces/basic-profile.abstract";
import { ClientEntity } from "../../client/entity/client.entity";

@Entity('holding')
@ObjectType()
export class HoldingEntity extends BasicProfileAbstract {
  @OneToMany(() => ClientEntity, (c) => c.holding)
  @Field(() => [ClientEntity], { description: 'creation date of the user' })
  clientList: ClientEntity[];
}