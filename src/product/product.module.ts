import { Module } from '@nestjs/common';
import { ProductService } from './service/product.service';
import { ProductResolver } from './resolver/product.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './entity/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])],
  providers: [ProductResolver, ProductService],
})
export class ProductModule {}
