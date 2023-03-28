import { Injectable, NotFoundException } from '@nestjs/common';
import { Equal, Repository } from 'typeorm';
import { UserEntity } from '../entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../model/user.interface';
import {
  from,
  Observable,
  switchMap,
  map,
  of,
  tap,
  catchError,
  throwError,
} from 'rxjs';
import { CreateUserInput } from '../model/dto/create-user.input';
import { UpdateUserInput } from '../model/dto/update-user.input';
import { ExistingRutException } from '../../utils/exceptions/ExistingRut';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  createUser(userDTO: CreateUserInput): Observable<UserEntity> {
    const user = this.userRepository.create(userDTO);
    return from(
      this.findUserByRut(user.rut).pipe(
        switchMap((existingUser) => {
          if (existingUser) {
            throw new ExistingRutException();
          }
          return from(this.userRepository.save(user));
        }),
      ),
    );
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
    return from(
      this.userRepository.findOne({
        relations: ['store'],
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
    return from(
      this.userRepository.findOne({
        relations: ['store'],
        where: {
          rut: rut,
        },
      }),
    ).pipe(
      map((user) => {
        if (!user) {
          throw new NotFoundException();
        }
        return user;
      }),
    );
  }
  findAll(): Observable<UserEntity[]> {
    return from(this.userRepository.find({ relations: ['store'] }));
  }
}
