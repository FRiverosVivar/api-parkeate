import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { UserTypesEnum } from '../constants/constants';

@Entity('user')
@ObjectType()
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String, { description: 'id of the user' })
  id: string;
  @Column('int')
  @Field(() => UserTypesEnum, { description: 'type of the user' })
  userType: UserTypesEnum;
  @Column({ nullable: true })
  @Field(() => String, { description: 'managerid of the user', nullable: true })
  manager: string;
  @Column({ nullable: true })
  @Field(() => String, { description: 'photo of the user', nullable: true })
  profilePhoto: string;
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Field(() => Date, { description: 'creation date of the user' })
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Field(() => Date, { description: 'creation date of the user' })
  updatedAt: Date;
  @Column()
  @Field(() => String, { description: 'name of the user' })
  name: string;
  @Column()
  @Field(() => String, { description: 'lastname of the user' })
  lastname: string;
  @Column({ unique: true })
  @Field(() => String, { description: 'rut of the user' })
  rut: string;
  @Column()
  @Field(() => String, { description: 'email of the user' })
  email: string;
  @Column()
  @Field(() => String, { description: 'hashed password of the user' })
  password: string;
}
