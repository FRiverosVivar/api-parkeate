import { Injectable, NotFoundException } from '@nestjs/common';
import { Equal, Repository } from 'typeorm';
import { UserEntity } from '../entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, switchMap, map } from 'rxjs';
import { UpdateUserInput } from '../model/dto/update-user.input';
import * as uuid from 'uuid';
import { UUIDBadFormatException } from '../../utils/exceptions/UUIDBadFormat.exception';
import { CreateUserInput } from '../model/dto/create-user.input';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  createUser(userDTO: CreateUserInput): Observable<UserEntity> {
    const user = this.userRepository.create(userDTO);
    return from(this.userRepository.save(user));
  }
  updateUser(updatedUser: UpdateUserInput): Observable<UserEntity> {
    return from(
      this.userRepository.preload({
        ...updatedUser,
      }),
    ).pipe(
      switchMap((user) => {
        if (!user) {
          throw new NotFoundException();
        }
        return from(this.userRepository.save(user));
      }),
    );
  }
  removeUser(userId: string): Observable<UserEntity> {
    if (uuid.validate(userId)) {
      throw new UUIDBadFormatException();
    }
    return from(
      this.userRepository.findOne({
        where: { id: userId },
      }),
    ).pipe(
      switchMap((user) => {
        if (!user) {
          throw new NotFoundException();
        }
        return from(this.userRepository.remove([user])).pipe(map((u) => u[0]));
      }),
    );
  }
  findUserById(userId: string): Observable<UserEntity> {
    if (!uuid.validate(userId)) {
      throw new UUIDBadFormatException();
    }

    return from(
      this.userRepository.findBy({
        id: Equal(userId),
      }),
    )
      .pipe(map((users) => users[0]))
      .pipe(
        map((user) => {
          if (!user) {
            throw new NotFoundException();
          }
          return user;
        }),
      );
  }
  findUserByRut(rut: string): Observable<UserEntity> {
    return this.getUserByRut(rut).pipe(
      map((user) => {
        if (!user) {
          throw new NotFoundException();
        }
        return user;
      }),
    );
  }
  getUserByRut(rut: string): Observable<UserEntity | null> {
    return from(
      this.userRepository.findOne({
        where: {
          rut: rut,
        },
      }),
    );
  }
  findAll(): Observable<UserEntity[]> {
    return from(this.userRepository.find());
  }
}
