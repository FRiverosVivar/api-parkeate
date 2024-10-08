import { Column } from "typeorm";
import { Field, ObjectType } from "@nestjs/graphql";
import { BasicProfileAbstract } from "./basic-profile.abstract";

@ObjectType()
export abstract class BaseCustomer extends BasicProfileAbstract {
  @Column()
  @Field(() => String, { description: "hashed password of the user" })
  password: string;
  @Column()
  @Field(() => Boolean, { description: "validated email" })
  validatedEmail: boolean;
  @Column()
  @Field(() => Boolean, { description: "validated phone" })
  validatedPhone: boolean;
  @Column()
  @Field(() => Boolean)
  validatedAccount: boolean;
}
