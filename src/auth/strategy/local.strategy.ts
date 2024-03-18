import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { map, Observable } from "rxjs";
import { UserEntity } from "../../user/entity/user.entity";
import { AuthService } from "../service/auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: "username",
      passwordField: "password",
      passReqToCallback: true,
    });
  }
  async validate(req: any, username: string, password: string) {
    return this.authService
      .validateCredentials(
        username,
        password,
        req.body.isClient,
        req.body.isGuard
      )
      .pipe(
        map((userOrClient) => {
          if (!userOrClient) {
            throw new NotFoundException();
          }
          return userOrClient;
        })
      )
      .toPromise();
  }
}
