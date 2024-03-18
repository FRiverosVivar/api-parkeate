import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GqlExecutionContext } from "@nestjs/graphql";

@Injectable()
export class GqlAuthGuard extends AuthGuard("local") {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext();
    let loginUserInput = ctx.getArgs().loginUserInput;
    let loginGuardInput = ctx.getArgs().loginGuardInput;
    let loginClientInput = ctx.getArgs().loginClientInput;
    if (loginClientInput) loginClientInput.isClient = true;
    if (loginGuardInput) loginGuardInput.isGuard = true;
    request.body = loginUserInput
      ? loginUserInput
      : loginClientInput
      ? loginClientInput
      : loginGuardInput;

    return request;
  }
}
