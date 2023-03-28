import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProductService } from '../service/product.service';
import { ProductEntity } from '../entity/product.entity';
import { UpdateProductInput } from '../model/dto/update-product.input';
import { CreateProductInput } from '../model/dto/create-product.input';

@Resolver(() => ProductEntity)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Mutation(() => ProductEntity)
  createProduct(
    @Args('createProductInput') createProductInput: CreateProductInput,
  ) {
    return this.productService.createProduct(createProductInput);
  }

  @Query(() => [ProductEntity], { name: 'products' })
  findAll() {
    return this.productService.findAll();
  }

  @Query(() => ProductEntity, { name: 'product' })
  findOne(@Args('productId', { type: () => String }) productId: string) {
    return this.productService.findProductById(productId);
  }
  @Mutation(() => ProductEntity)
  updateProduct(
    @Args('updateProductInput') updateProductInput: UpdateProductInput,
  ) {
    return this.productService.updateProduct(updateProductInput);
  }

  @Mutation(() => ProductEntity)
  removeProduct(@Args('productId', { type: () => String }) productId: string) {
    return this.productService.removeProduct(productId);
  }
}
