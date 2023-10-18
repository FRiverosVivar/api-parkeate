import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class PrepaidHourParking {
    @Field(() => Number)
    amountToBePaid: number
    @Field(() => Number)
    tax: number
    @Field(() => Number)
    initialPrice: number
}