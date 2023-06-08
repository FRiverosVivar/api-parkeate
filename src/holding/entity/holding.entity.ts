import { Column, Entity } from "typeorm";
import { Field, ObjectType } from "@nestjs/graphql";
import { BasicProfileAbstract } from "../../utils/interfaces/basic-profile.abstract";

@Entity('holding')
@ObjectType()
export class HoldingEntity extends BasicProfileAbstract {
  @Column()
  @Field(() => String, { description: 'creation date of the user' })
  parkingList: string;
}