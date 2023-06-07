import { UserEntity } from '../../entity/user.entity';

export interface UserWithSmsCode {
  user: UserEntity;
  smsCode: number;
}
