import { Args, Mutation, Query, Resolver } from "@nestjs/graphql/dist/decorators";
import { StoreEntity } from '../entity/store.entity';
import { StoreService } from '../service/store.service';
import { CreateStoreInput } from '../model/dto/create-store.input';
import { UpdateStoreInput } from '../model/dto/update-store.input';

@Resolver(() => StoreEntity)
export class StoreResolver {
  constructor(private readonly storeService: StoreService) {}

  @Mutation(() => StoreEntity)
  createStore(@Args('createStoreInput') createStoreInput: CreateStoreInput) {
    return this.storeService.createStore(createStoreInput);
  }

  @Query(() => [StoreEntity], { name: 'stores' })
  findAll() {
    return this.storeService.findAll();
  }

  @Query(() => StoreEntity, { name: 'store' })
  findOne(@Args('storeId', { type: () => String }) storeId: string) {
    return this.storeService.findStoreById(storeId);
  }
  @Mutation(() => StoreEntity)
  updateStore(@Args('updateStoreInput') updateStoreInput: UpdateStoreInput) {
    return this.storeService.updateStore(updateStoreInput);
  }

  @Mutation(() => StoreEntity)
  removeStore(@Args('storeId', { type: () => String }) storeId: string) {
    return this.storeService.removeStore(storeId);
  }
}
