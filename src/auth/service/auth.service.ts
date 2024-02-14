import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { CryptService } from "../../utils/crypt/crypt.service";
import { map, Observable, switchMap, of, forkJoin, from } from "rxjs";
import { UserEntity } from "../../user/entity/user.entity";
import { UserService } from "../../user/service/user.service";
import { JwtService } from "@nestjs/jwt";
import { UserLoginResponse } from "../../user/model/dto/user-login.response";
import { jwtConstants } from "../../user/constants/constants";
import { CreateUserInput } from "../../user/model/dto/create-user.input";
import { ExistingRutException } from "../../utils/exceptions/ExistingRut.exception";
import { UserPayload } from "../model/user-payload.model";
import { CreateClientInput } from "../../client/model/create-client.input";
import { ClientService } from "../../client/service/client.service";
import { ClientEntity } from "../../client/entity/client.entity";
import { ClientLoginResponse } from "../../client/model/client-login.response";
import { NotValidatedAccountException } from "../../utils/exceptions/not-validated-account.exception";
import { LoginClientInput } from "../../client/model/login-client.input";
import { UpdateUserInput } from "../../user/model/dto/update-user.input";
import { NotificationService } from "src/utils/notification/notification.service";
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private clientService: ClientService,
    private jwtService: JwtService,
    private bcryptService: CryptService,
    private notificationService: NotificationService
  ) {}
  createUser(createUserInput: CreateUserInput): Observable<UserEntity> {
    if (!createUserInput.wallet) createUserInput.wallet = 0;

    return this.userService.getUserByRut(createUserInput.rut).pipe(
      switchMap((existingUser) => {
        if (existingUser) {
          throw new ExistingRutException();
        }
        const password = createUserInput.password;
        return this.bcryptService.hash(password).pipe(
          switchMap((hashedPassword) => {
            createUserInput.password = hashedPassword;
            if (createUserInput.supplier) {
              const createClientInput = {
                ...(createUserInput as unknown as CreateClientInput),
                supplier: true,
              };
              return from(
                this.clientService.createClient(createClientInput)
              ).pipe(
                switchMap(() => {
                  return this.userService.createUser(createUserInput);
                })
              );
            }
            return this.userService.createUser(createUserInput);
          })
        );
      })
    );
  }
  updateUserPassword(updateUserInput: UpdateUserInput): Observable<UserEntity> {
    return this.userService.findUserById(updateUserInput.id).pipe(
      switchMap((u) => {
        return this.bcryptService.hash(updateUserInput.password!).pipe(
          switchMap((hashedPassword) => {
            updateUserInput.password = hashedPassword;
            return this.userService.updateUser(updateUserInput);
          })
        );
      })
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
            return from(this.clientService.createClient(createClientInput));
          })
        );
      })
    );
  }
  validateCredentials(
    username: string,
    password: string,
    isClient: boolean
  ): Observable<UserEntity | ClientEntity | undefined> {
    if (isClient) {
      return this.clientService.findClientByRut(username).pipe(
        switchMap((c) => {
          return this.bcryptService.compare(password, c.password).pipe(
            map((areSamePassword) => {
              return areSamePassword ? c : undefined;
            })
          );
        })
      );
    }
    return this.userService.findUserByRut(username).pipe(
      switchMap((u) => {
        return this.bcryptService.compare(password, u.password).pipe(
          map((areSamePassword) => {
            return areSamePassword ? u : undefined;
          })
        );
      })
    );
  }
  login(user: UserEntity) {
    if (!user.validatedAccount) throw new NotValidatedAccountException();
    this.notificationService.sendNotificationToListOfUsers(
      [user.id],
      "login exitoso!",
      "sesion iniciada"
    );
    return {
      user: user,
      access_token: this.jwtService.sign(
        {
          username: user.rut,
          userType: user.userType,
          sub: user.id,
        },
        { secret: jwtConstants.secret, expiresIn: "60s" }
      ),
    } as UserLoginResponse;
  }
  async clientLogin(loginInput: LoginClientInput) {
    const user = await this.clientService
      .findClientByRut(loginInput.username)
      .toPromise();
    if (!user) throw new NotFoundException();

    if (!user.validatedAccount) throw new NotValidatedAccountException();

    return {
      client: user,
      access_token: this.jwtService.sign(
        {
          username: user.rut,
          userType: user.userType,
          sub: user.id,
        },
        { secret: jwtConstants.secret, expiresIn: "60s" }
      ),
    } as ClientLoginResponse;
  }
  refreshToken(token: string): Observable<UserLoginResponse> {
    const user = this.jwtService.decode(token) as UserPayload;
    if (!user) {
      throw new NotFoundException();
    }
    return this.userService.findUserById(user.sub).pipe(
      switchMap((userEntity) => {
        return of({
          user: userEntity,
          access_token: this.jwtService.sign(
            {
              username: user.username,
              userType: user.userType,
              sub: user.sub,
            },
            { secret: jwtConstants.secret, expiresIn: "60s" }
          ),
        } as UserLoginResponse);
      })
    );
  }
  refreshClientToken(token: string): Observable<ClientLoginResponse> {
    const user = this.jwtService.decode(token) as UserPayload;
    if (!user) {
      throw new NotFoundException();
    }
    return this.clientService.findClientById(user.sub).pipe(
      switchMap((clientEntity) => {
        return of({
          client: clientEntity,
          access_token: this.jwtService.sign(
            {
              username: user.username,
              userType: user.userType,
              sub: user.sub,
            },
            { secret: jwtConstants.secret, expiresIn: "60s" }
          ),
        } as ClientLoginResponse);
      })
    );
  }
}
