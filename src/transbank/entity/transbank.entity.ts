import { Field, ObjectType } from "@nestjs/graphql";
import { UserEntity } from 'src/user/entity/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity('transbank')
@ObjectType()
export class TransbankEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String)
  id: string;
  
  @Column({ type: 'varchar', length: 40 })
  @Field(() => String)
  tbk_user: string;

  @Column({ type: 'varchar', length: 6 })
  @Field(() => String)
  authorization_code: string;  

  @Column({ type: 'varchar', length: 15 })
  @Field(() => String)
  card_type: string;  

  @Column({ type: 'varchar', length: 4 })
  @Field(() => String)
  card_number: string;
  
  @ManyToOne(() => UserEntity, (u) => u.tbkId)
  @Field(() => UserEntity)
  user: UserEntity;

  @Column({ nullable: true })
  @Field(() => Boolean)
  isActive: boolean;
}
