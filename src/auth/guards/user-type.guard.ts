import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserTypesEnum } from "../../user/constants/constants";
import { GqlExecutionContext } from "@nestjs/graphql";

@Injectable()
export class UserTypeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  matchesUserTypes(userType: UserTypesEnum, types: number[]) {

    return types.some((type) => userType <= type);
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
    const userType = ctx.getContext().req.user.userType
    return this.matchesUserTypes(userType ? userType : UserTypesEnum.USER, type)
  }
}
