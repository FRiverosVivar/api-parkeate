import {
  Column,
} from 'typeorm';
import { Field } from '@nestjs/graphql';
import { BasicProfileAbstract } from "./basic-profile.abstract";

export abstract class BaseCustomer extends BasicProfileAbstract {
  @Column()
  @Field(() => String, { description: 'hashed password of the user' })
  password: string;
  @Column()
  @Field(() => String)
  parkingList: string;
}
