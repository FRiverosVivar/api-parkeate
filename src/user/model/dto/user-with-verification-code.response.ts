import { UserEntity } from '../../entity/user.entity';

export interface UserWithVerificationCode {
  user: UserEntity;
  code: number;
}
