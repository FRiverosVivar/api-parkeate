import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserEntity } from '../../user/entity/user.entity';
import { UserTypesEnum } from '../../user/constants/constants';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class UserTypeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  matchesUserTypes(userType: UserTypesEnum, types: number[]) {
    return types.some((type) => userType >= type);
  }
  canActivate(context: ExecutionContext): boolean {
    const type = this.reflector.get<UserTypesEnum[]>(
      'usertype',
      context.getHandler(),
    );
    if (!type) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getArgs().user;
    const client = ctx.getArgs().client
    return this.matchesUserTypes(user ? user.userType: client.userType, type);
  }
}
