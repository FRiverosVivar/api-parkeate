import { Field, Int, ObjectType } from "@nestjs/graphql";
import { BaseEntityWithIdAbstract } from "src/utils/interfaces/base-entity-with-id.abstract";
import { Column, Entity, ManyToOne } from "typeorm";
import { CardTypesEnum } from "../constants/card-type.enum";
import { UserEntity } from "./user.entity";

@Entity("user_card")
@ObjectType()
export class CardEntity extends BaseEntityWithIdAbstract {
  @Field(() => UserEntity)
  user: UserEntity;
  @Column()
  @Field(() => String)
  paykuCardId: string;
  @Column()
  @Field(() => Int)
  lastNumbers: number;
  @Column()
  @Field(() => Int)
  cardType: CardTypesEnum;
}
