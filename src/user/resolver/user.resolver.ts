import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserService } from '../service/user.service';
import { CreateUserInput } from '../model/dto/create-user.input';
import { UpdateUserInput } from '../model/dto/update-user.input';
import { UserEntity } from '../entity/user.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Inject, UseGuards } from '@nestjs/common';
import { Public } from "../../auth/decorator/public.decorator";
import { GqlAuthGuard } from "../../auth/guards/gql.guard";

@Resolver(() => UserEntity)
export class UserResolver {
  constructor(private readonly userService: UserService) {}



  @Query(() => [UserEntity], { name: 'users' })
  @UseGuards(JwtAuthGuard)
  findAll(@Context() context: any) {
    return this.userService.findAll();
  }

  @Query(() => UserEntity, { name: 'userById' })
  findOne(@Args('userId', { type: () => String }) userId: string) {
    return this.userService.findUserById(userId);
  }
  @Query(() => UserEntity, { name: 'userByRut' })
  findOneByRut(@Args('rut', { type: () => String }) rut: string) {
    return this.userService.findUserByRut(rut);
  }
  @Mutation(() => UserEntity)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.userService.updateUser(updateUserInput);
  }

  @Mutation(() => UserEntity)
  removeUser(@Args('userId', { type: () => String }) userId: string) {
    return this.userService.removeUser(userId);
  }
}
