import { Module } from '@nestjs/common';
import { StoreService } from './service/store.service';
import { StoreResolver } from './resolver/store.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreEntity } from './entity/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StoreEntity])],
  providers: [StoreResolver, StoreService],
})
export class StoreModule {}
