import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { StoreEntity } from '../entity/store.entity';
import { from, map, Observable, switchMap } from 'rxjs';
import { CreateStoreInput } from '../model/dto/create-store.input';
import { UpdateStoreInput } from '../model/dto/update-store.input';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}
  createStore(storeDTO: CreateStoreInput): Observable<StoreEntity> {
    const store = this.storeRepository.create(storeDTO);
    if (!store)
      throw new BadRequestException(
        'Verify the consistency of the object that was sent',
      );

    return from(this.storeRepository.save(store));
  }
  removeStore(storeId: string): Observable<StoreEntity> {
    return from(
      this.storeRepository.findOne({
        relations: ['user, product'],
        where: { id: storeId },
      }),
    ).pipe(
      switchMap((store) => {
        if (!store) {
          throw new NotFoundException();
        }
        return from(this.storeRepository.remove([store])).pipe(
          map((s) => s[0]),
        );
      }),
    );
  }
  updateStore(updatedStore: UpdateStoreInput): Observable<StoreEntity> {
    return from(
      this.storeRepository.preload({
        ...updatedStore,
      }),
    ).pipe(
      switchMap((store) => {
        if (!store) {
          throw new NotFoundException();
        }
        return from(this.storeRepository.save(store));
      }),
    );
  }
  findStoreById(storeId: string): Observable<StoreEntity> {
    return from(
      this.storeRepository.findBy({
        id: Equal(storeId),
      }),
    )
      .pipe(map((stores) => stores[0]))
      .pipe(
        map((store) => {
          if (!store) {
            throw new NotFoundException();
          }
          return store;
        }),
      );
  }
  findAll(): Observable<StoreEntity[]> {
    return from(this.storeRepository.find({ relations: ['user, product'] }));
  }
}
