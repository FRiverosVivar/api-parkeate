import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CryptService } from '../../utils/crypt/crypt.service';
import { map, Observable, switchMap, of } from 'rxjs';
import { UserEntity } from '../../user/entity/user.entity';
import { UserService } from '../../user/service/user.service';
import { JwtService } from '@nestjs/jwt';
import { UserLoginResponse } from '../../user/model/dto/user-login.response';
import { jwtConstants } from '../../user/constants/constants';
import { CreateUserInput } from '../../user/model/dto/create-user.input';
import { ExistingRutException } from '../../utils/exceptions/ExistingRut.exception';
import { UserPayload } from "../model/user-payload.model";
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private bcryptService: CryptService,
  ) {}
  createUser(createUserInput: CreateUserInput): Observable<UserEntity> {
    return this.userService.getUserByRut(createUserInput.rut).pipe(
      switchMap((existingUser) => {
        if (existingUser) {
          throw new ExistingRutException();
        }
        const password = createUserInput.password;
        return this.bcryptService.hash(password).pipe(
          switchMap((hashedPassword) => {
            createUserInput.password = hashedPassword;
            return this.userService.createUser(createUserInput);
          }),
        );
      }),
    );
  }
  validateCredentials(
    username: string,
    password: string,
  ): Observable<UserEntity | undefined> {
    return this.userService.findUserByRut(username).pipe(
      switchMap((user) => {
        return this.bcryptService.compare(password, user.password).pipe(
          map((areSamePassword) => {
            return areSamePassword ? user : undefined;
          }),
        );
      }),
    );
  }
  login(user: UserEntity) {
    return {
      user: user,
      access_token: this.jwtService.sign(
        {
          username: user.rut,
          sub: user.id,
        },
        { secret: jwtConstants.secret, expiresIn: '60s' },
      ),
    } as UserLoginResponse;
  }
  refreshToken(token: string): Observable<UserLoginResponse> {
    const user = this.jwtService.decode(token) as UserPayload;
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.userService.findUserById(user.sub).pipe(
      switchMap((userEntity) => {
        return of({
          user: userEntity,
          access_token: this.jwtService.sign(
            {
              username: user.username,
              sub: user.sub,
            },
            { secret: jwtConstants.secret, expiresIn: '60s' },
          ),
        } as UserLoginResponse);
      }),
    );
  }
}
