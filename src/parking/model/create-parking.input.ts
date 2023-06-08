import { ArgsType, Field, InputType } from "@nestjs/graphql";
import { BaseCustomer } from "../../utils/interfaces/base-customer.abstract";

@InputType()
@ArgsType()
export class CreateParkingInput {
  @Field(() => String)
  name: string
  @Field(() => String)
  address: string
  @Field(() => String)
  coords: string
  @Field(() => [String])
  blockedUsers: string[]
  @Field(() => String)
  tax: number
  @Field(() => String)
  ownerId: string
  @Field(() => BaseCustomer)
  customer: BaseCustomer
}