import { ClientEntity } from '../entity/client.entity';

export interface ClientWithSmsCode {
  client: ClientEntity;
  smsCode: number;
}
