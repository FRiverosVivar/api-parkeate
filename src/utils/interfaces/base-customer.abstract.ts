import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Field } from '@nestjs/graphql';

export abstract class BaseCustomer {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String, { description: 'id of the user' })
  id: string;
  @Column({ nullable: true })
  @Field(() => String, { description: 'photo of the user', nullable: true })
  profilePhoto: string;
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Field(() => Date, { description: 'creation date of the user' })
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Field(() => Date, { description: 'creation date of the user' })
  updatedAt: Date;
  @Column({ unique: true })
  @Field(() => String, { description: 'rut of the user' })
  rut: string;
  @Column()
  @Field(() => String, { description: 'name of the holding' })
  fullname: string;
  @Column()
  @Field(() => String, { description: 'email of the user' })
  email: string;
  @Column()
  @Field(() => String, { description: 'hashed password of the user' })
  password: string;
  @Column()
  @Field(() => String, { description: 'phone number of the user' })
  phoneNumber: string;
  @Column()
  @Field(() => String)
  parkingList: string;
}
