import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UserLoginResponse } from '../../user/model/dto/user-login.response';
import { UseGuards } from '@nestjs/common';
import { LoginUserInput } from '../../user/model/dto/login-user.input';
import { AuthService } from '../service/auth.service';
import { Public } from '../decorator/public.decorator';
import { UserEntity } from '../../user/entity/user.entity';
import { CreateUserInput } from '../../user/model/dto/create-user.input';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GqlAuthGuard } from '../guards/gql.guard';
import { CreateClientInput } from '../../client/model/create-client.input';
import { LoginClientInput } from '../../client/model/login-client.input';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => UserEntity)
  @Public()
  @UseGuards(JwtAuthGuard)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.authService.createUser(createUserInput);
  }
  @Mutation(() => UserEntity)
  @Public()
  @UseGuards(JwtAuthGuard)
  createClient(
    @Args('createClientInput') createClientInput: CreateClientInput,
  ) {
    return this.authService.createClient(createClientInput);
  }
  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserLoginResponse, { name: 'clientLogin' })
  clientLogin(
    @Args('loginClientInput') loginInput: LoginClientInput,
    @Context() context: any,
  ) {
    return this.authService.clientLogin(context.user);
  }
  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserLoginResponse, { name: 'login' })
  userLogin(
    @Args('loginUserInput') loginInput: LoginUserInput,
    @Context() context: any,
  ) {
    return this.authService.login(context.user);
  }
  @Mutation(() => UserLoginResponse)
  @Public()
  refreshToken(@Args('accessToken') accessToken: string) {
    return this.authService.refreshToken(accessToken);
  }
}
