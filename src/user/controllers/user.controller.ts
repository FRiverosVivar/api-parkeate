import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { UserService } from '../service/user.service';
import { User } from '../model/user.interface';
import { Observable } from 'rxjs';
import { CreateUserInput } from '../model/dto/create-user.input';
import { UpdateUserInput } from '../model/dto/update-user.input';
import { UserEntity } from '../entity/user.entity';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  create(@Body() user: CreateUserInput): Observable<User> {
    return this.userService.createUser(user);
  }
  @Put()
  update(@Body() user: UpdateUserInput): Observable<User | null> {
    return this.userService.updateUser(user);
  }
  @Get('/:id')
  getById(@Param('id') id: string): Observable<UserEntity | null> {
    return this.userService.findUserById(id);
  }

  @Get()
  getByRut(@Param('rut') rut: string): Observable<User | null> {
    return this.userService.findUserByRut(rut);
  }
}
