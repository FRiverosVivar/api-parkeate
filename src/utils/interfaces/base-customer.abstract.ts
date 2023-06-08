import {
  Column, Entity, JoinTable, OneToMany
} from "typeorm";
import { Field, ObjectType } from "@nestjs/graphql";
import { BasicProfileAbstract } from "./basic-profile.abstract";
import { ParkingEntity } from "../../parking/entity/parking.entity";

@ObjectType()
export abstract class BaseCustomer extends BasicProfileAbstract {
  @Column()
  @Field(() => String, { description: 'hashed password of the user' })
  password: string;
}
