import { ClientEntity } from '../entity/client.entity';

export interface ClientWithVerificationCode {
  client: ClientEntity;
  code: number;
}
