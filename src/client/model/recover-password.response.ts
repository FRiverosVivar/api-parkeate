import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class RecoverPasswordCodeAndClientId {
  @Field(() => String)
  id: string  
  @Field(() => Number)
  code: number;
}
