import { ClientEntity } from '../entity/client.entity';
import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class ClientWithSmsCode {
  @Field(() => ClientEntity)
  client: ClientEntity;
  @Field(() => Number)
  smsCode: number;
}
