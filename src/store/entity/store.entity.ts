import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { UserEntity } from '../../user/entity/user.entity';
import { ProductEntity } from '../../product/entity/product.entity';

@Entity('store')
@ObjectType()
export class StoreEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String, { description: 'id of the store' })
  id: string;
  @Column()
  @Field(() => String, { description: 'city of the store' })
  city: string;
  @Column()
  @Field(() => String, { description: 'address of the store' })
  address: string;
  @Column({ type: 'simple-array', nullable: true })
  @ManyToMany(() => UserEntity, (user) => user.stores)
  @JoinTable({
    name: 'users_stores_relation',
    joinColumn: {
      name: 'store_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  @Field(() => [UserEntity], {
    description: 'employees of the store',
    nullable: true,
  })
  employees: UserEntity[];
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Field(() => Date, { description: 'creation date of the store' })
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Field(() => Date, { description: 'update date of the store' })
  updatedAt: Date;
  @Column({ type: 'simple-array', nullable: true, array: true })
  @ManyToMany(() => ProductEntity, (product) => product.stores)
  @JoinTable({
    name: 'stores_products_relation',
    joinColumn: {
      name: 'store_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'product_id',
      referencedColumnName: 'id',
    },
  })
  @Field(() => [ProductEntity], { description: '' })
  products: ProductEntity[];
}
