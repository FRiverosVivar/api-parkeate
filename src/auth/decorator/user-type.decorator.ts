import { SetMetadata } from '@nestjs/common';
import { UserTypesEnum } from '../../user/constants/constants';

export const UserType = (...args: UserTypesEnum[]) => {
  console.log(args);
  return SetMetadata('usertype', args);
};
