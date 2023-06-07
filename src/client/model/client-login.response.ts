import { Field, ObjectType } from '@nestjs/graphql';
import { ClientEntity } from '../entity/client.entity';

@ObjectType()
export class ClientLoginResponse {
  @Field(() => ClientEntity)
  client: ClientEntity;

  @Field(() => String)
  access_token: string;
}
