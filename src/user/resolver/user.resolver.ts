import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UserService } from '../service/user.service';
import { CreateUserInput } from '../model/dto/create-user.input';
import { UpdateUserInput } from '../model/dto/update-user.input';
import { UserEntity } from '../entity/user.entity';

@Resolver(() => UserEntity)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => UserEntity)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.userService.createUser(createUserInput);
  }

  @Query(() => [UserEntity], { name: 'users' })
  findAll() {
    return this.userService.findAll();
  }

  @Query(() => UserEntity, { name: 'user' })
  findOne(@Args('userId', { type: () => String }) userId: string) {
    return this.userService.findUserById(userId);
  }
  @Query(() => UserEntity, { name: 'user' })
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
