import { ArgsType, Field, InputType, PartialType } from "@nestjs/graphql";
import { CreateTagInput } from "./create-tag.input";
import { Column } from "typeorm";

@InputType()
@ArgsType()
export class UpdateTagInput extends PartialType(CreateTagInput) {
  @Column()
  @Field(() => String)
  id: string;
}