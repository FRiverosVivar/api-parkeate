import { Field, InputType } from "@nestjs/graphql";
import { IsIn } from "class-validator";
@InputType()
export class UserFilterInput {
@Field(() => Boolean, { nullable: true })
filterByValidatedEmail?: boolean;

@Field(() => Boolean, { nullable: true })
filterByValidatedPhone?: boolean;
}