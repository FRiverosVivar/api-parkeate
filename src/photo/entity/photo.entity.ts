import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Field, ObjectType } from "@nestjs/graphql";
import { BasicProfileAbstract } from "../../utils/interfaces/basic-profile.abstract";
import { BuildingEntity } from "../../building/entity/building.entity";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";

@Entity("photo")
@ObjectType()
export class PhotoEntity {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id: string;
  @Column()
  @Field(() => String)
  url: string;
  @Column()
  @Field(() => String, { nullable: true })
  name: string;
  @Column()
  @Field(() => String)
  creatorId: string;
}
