import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductEntity } from '../entity/product.entity';
import { Equal, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { from, map, Observable, switchMap } from 'rxjs';
import { CreateProductInput } from '../model/dto/create-product.input';
import { UpdateProductInput } from '../model/dto/update-product.input';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}
  createProduct(productDTO: CreateProductInput): Observable<ProductEntity> {
    const product = this.productRepository.create(productDTO);
    if (!product)
      throw new BadRequestException(
        'Verify the consistency of the object that was sent',
      );

    return from(this.productRepository.save(product));
  }
  removeProduct(productId: string): Observable<ProductEntity> {
    return from(
      this.productRepository.findOne({ where: { id: productId } }),
    ).pipe(
      switchMap((product) => {
        if (!product) {
          throw new NotFoundException();
        }
        return from(this.productRepository.remove([product])).pipe(
          map((s) => s[0]),
        );
      }),
    );
  }
  updateProduct(updatedProduct: UpdateProductInput): Observable<ProductEntity> {
    return from(
      this.productRepository.preload({
        ...updatedProduct,
      }),
    ).pipe(
      switchMap((product) => {
        if (!product) {
          throw new NotFoundException();
        }
        return from(this.productRepository.save(product));
      }),
    );
  }
  findProductById(productId: string): Observable<ProductEntity> {
    return from(
      this.productRepository.findBy({
        id: Equal(productId),
      }),
    )
      .pipe(map((products) => products[0]))
      .pipe(
        map((product) => {
          if (!product) {
            throw new NotFoundException();
          }
          return product;
        }),
      );
  }
  findAll(): Observable<ProductEntity[]> {
    return from(this.productRepository.find());
  }
}
