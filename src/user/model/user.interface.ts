import { UserTypesEnum } from './user.constants';

export interface User {
  id: string;
  rut: string;
  email: string;
  name: string;
  lastname: string;
  userType: UserTypesEnum;
  createdAt: Date;
  managerId?: string;
  profilePhotoId?: string;
  storeId?: string;
}
