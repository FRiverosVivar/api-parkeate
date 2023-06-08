import { Field, ObjectType } from "@nestjs/graphql";
import { Entity, ManyToOne } from "typeorm";
import { MultiplePhotosAbstract } from "../model/multiple-photos.abstract";

@ObjectType()
@Entity()
export class MultiplePhotosEntity extends MultiplePhotosAbstract {
  @ManyToOne(() => Object, { eager: true})
  @Field(() => String)
  entity: string;
}