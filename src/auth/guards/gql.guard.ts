import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlAuthGuard extends AuthGuard('local') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext();
    let loginUserInput = ctx.getArgs().loginUserInput;
    let loginClientInput = ctx.getArgs().loginClientInput;
    loginClientInput.isClient = true
    request.body = loginUserInput ? loginUserInput : loginClientInput;
    return request;
  }
}
