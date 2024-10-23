import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { UserLoginResponse } from "../../user/model/dto/user-login.response";
import { UseGuards } from "@nestjs/common";
import { LoginUserInput } from "../../user/model/dto/login-user.input";
import { AuthService } from "../service/auth.service";
import { Public } from "../decorator/public.decorator";
import { UserEntity } from "../../user/entity/user.entity";
import { CreateUserInput } from "../../user/model/dto/create-user.input";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { GqlAuthGuard } from "../guards/gql.guard";
import { CreateClientInput } from "../../client/model/create-client.input";
import { LoginClientInput } from "../../client/model/login-client.input";
import { ClientLoginResponse } from "../../client/model/client-login.response";
import { Observable } from "rxjs";
import { ClientEntity } from "../../client/entity/client.entity";
import { UpdateUserInput } from "../../user/model/dto/update-user.input";
import { ParkingGuardLoginResponse } from "src/parkingGuard/model/parking-guard-login-response.response";
import { ParkingGuardEntity } from "src/parkingGuard/entity/parkingGuard.entity";
import { CreateParkingGuardInput } from "src/parkingGuard/model/create-parking-guard.input";
import { LoginGuardInput } from "src/event/model/login-guard.input";

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => UserEntity)
  @Public()
  @UseGuards(JwtAuthGuard)
  createUser(@Args("createUserInput") createUserInput: CreateUserInput) {
    return this.authService.createUser(createUserInput);
  }
  @Mutation(() => ClientEntity)
  @Public()
  @UseGuards(JwtAuthGuard)
  createClient(
    @Args("createClientInput") createClientInput: CreateClientInput
  ): Observable<ClientEntity> {
    return this.authService.createClient(createClientInput);
  }
  @Mutation(() => ParkingGuardEntity)
  @Public()
  @UseGuards(JwtAuthGuard)
  createGuard(
    @Args("createParkingGuardInput")
    createParkingGuardInput: CreateParkingGuardInput
  ): Promise<ParkingGuardEntity> {
    return this.authService.createGuard(createParkingGuardInput);
  }
  @UseGuards(GqlAuthGuard)
  @Mutation(() => ParkingGuardLoginResponse, { name: "guardLogin" })
  guardLogin(@Args("loginGuardInput") loginInput: LoginGuardInput) {
    return this.authService.parkingGuardLogin(loginInput);
  }
  @UseGuards(GqlAuthGuard)
  @Mutation(() => ClientLoginResponse, { name: "clientLogin" })
  clientLogin(@Args("loginClientInput") loginInput: LoginClientInput) {
    return this.authService.clientLogin(loginInput);
  }
  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserLoginResponse, { name: "login" })
  userLogin(
    @Args("loginUserInput") loginInput: LoginUserInput,
    @Context() context: any
  ) {
    return this.authService.login(context.user);
  }
  @Mutation(() => UserLoginResponse)
  @Public()
  refreshToken(@Args("accessToken") accessToken: string) {
    return this.authService.refreshToken(accessToken);
  }
  @Mutation(() => ClientLoginResponse)
  @Public()
  refreshClientToken(@Args("accessToken") accessToken: string) {
    return this.authService.refreshClientToken(accessToken);
  }
  @Mutation(() => ParkingGuardLoginResponse)
  @Public()
  refreshGuardToken(@Args("accessToken") accessToken: string) {
    return this.authService.refreshGuardToken(accessToken);
  }
  @Mutation(() => UserEntity)
  @Public()
  updateUserPassword(
    @Args("updateUserInput") updateUserInput: UpdateUserInput
  ) {
    return this.authService.updateUserPassword(updateUserInput);
  }
}
