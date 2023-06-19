import { ClientEntity } from '../entity/client.entity';
import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class ClientWithVerificationCode {
  @Field(() => ClientEntity)
  client: ClientEntity;
  @Field(() => Number)
  code: number;
}
