import { Field, InputType } from "@nestjs/graphql";
import { IsIn } from "class-validator";

@InputType()
export class UserFilterInput {
  @Field(() => String, { nullable: true })
  @IsIn(["validated", "notValidated", null])
  filterByValidatedEmail: "validated" | "notValidated" | null;

  @Field(() => String, { nullable: true })
  @IsIn(["validated", "notValidated", null])
  filterByValidatedPhone: "validated" | "notValidated" | null;
}