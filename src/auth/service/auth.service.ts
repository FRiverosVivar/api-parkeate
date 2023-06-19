import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { CryptService } from '../../utils/crypt/crypt.service';
import { map, Observable, switchMap, of, forkJoin } from "rxjs";
import { UserEntity } from '../../user/entity/user.entity';
import { UserService } from '../../user/service/user.service';
import { JwtService } from '@nestjs/jwt';
import { UserLoginResponse } from '../../user/model/dto/user-login.response';
import { jwtConstants } from '../../user/constants/constants';
import { CreateUserInput } from '../../user/model/dto/create-user.input';
import { ExistingRutException } from '../../utils/exceptions/ExistingRut.exception';
import { UserPayload } from '../model/user-payload.model';
import { CreateClientInput } from '../../client/model/create-client.input';
import { ClientService } from '../../client/service/client.service';
import { ClientEntity } from '../../client/entity/client.entity';
import { ClientLoginResponse } from '../../client/model/client-login.response';
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private clientService: ClientService,
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
  createClient(createClientInput: CreateClientInput): Observable<ClientEntity> {
    return this.clientService.getClientByRut(createClientInput.rut).pipe(
      switchMap((existingUser) => {
        if (existingUser) {
          throw new ExistingRutException();
        }

        const password = createClientInput.password;
        return this.bcryptService.hash(password).pipe(
          switchMap((hashedPassword) => {
            createClientInput.password = hashedPassword;
            return this.clientService.createClient(createClientInput);
          }),
        );
      }),
    );
  }
  validateCredentials(
    username: string,
    password: string,
  ): Observable<UserEntity | ClientEntity | undefined> {
    const login = forkJoin(
      [
        this.userService.getUserByRut(username),
        this.clientService.getClientByRut(username)
      ]
    )
    return login.pipe(
      switchMap(([user, client]) => {
        if(user)
          return this.bcryptService.compare(password, user.password).pipe(
            map((areSamePassword) => {
              return areSamePassword ? user : undefined;
            }),
          );
        else if(client)
          return this.bcryptService.compare(password, client.password).pipe(
            map((areSamePassword) => {
              return areSamePassword ? client : undefined;
            }),
          );

        return of(undefined)
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
  clientLogin(user: ClientEntity) {
    return {
      client: user,
      access_token: this.jwtService.sign(
        {
          username: user.rut,
          sub: user.id,
        },
        { secret: jwtConstants.secret, expiresIn: '60s' },
      ),
    } as ClientLoginResponse;
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
  refreshClientToken(token: string): Observable<ClientLoginResponse> {
    const user = this.jwtService.decode(token) as UserPayload;
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.clientService.findClientById(user.sub).pipe(
      switchMap((clientEntity) => {
        return of({
          client: clientEntity,
          access_token: this.jwtService.sign(
            {
              username: user.username,
              sub: user.sub,
            },
            { secret: jwtConstants.secret, expiresIn: '60s' },
          ),
        } as ClientLoginResponse);
      }),
    );
  }
}
