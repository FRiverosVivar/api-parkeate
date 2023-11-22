import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class PaykuCustomer {
  @Field(() => [Card])
  customers: Card[];
}
@ObjectType()
export class Card {
  @Field(() => String)
  last_4_digits: string;
  @Field(() => String)
  identifier: string;
  @Field(() => String)
  card_type: string;
  @Field(() => String)
  register: string;
}
