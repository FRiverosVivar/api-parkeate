import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { StoreEntity } from '../../store/entity/store.entity';

@Entity('product')
@ObjectType()
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String, { description: 'id of the product' })
  id: string;
  @Column()
  @Field(() => String, { description: 'stock of the product' })
  name: string;
  @Column()
  @Field(() => String, { description: 'description of the product' })
  description: string;
  @Column('int')
  @Field(() => Int, { description: 'stock of the product' })
  stock: number;
  @Column()
  @Field(() => String, { description: 'brand of the product' })
  brand: string;
  @Column('int')
  @Field(() => Int, { description: 'price of the product' })
  price: number;
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Field(() => Date, { description: 'creation date of the product' })
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Field(() => Date, { description: 'update date of the product' })
  updatedAt: Date;
  @Column({ type: 'simple-array', nullable: true, array: true })
  @ManyToMany(() => StoreEntity, (store) => store.products)
  @Field(() => [StoreEntity], { description: 'stores of the product' })
  stores: StoreEntity[];
}
