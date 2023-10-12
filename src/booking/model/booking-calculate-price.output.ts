import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class BookingPriceCalculated {
    @Field(() => Number)
    priceToBePaid: number
}