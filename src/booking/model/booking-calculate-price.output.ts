import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class BookingPriceCalculated {
    @Field(() => Number)
    priceToBePaid: number
    @Field(() => Number)
    discount: number
    @Field(() => Number)
    originalPrice: number
}