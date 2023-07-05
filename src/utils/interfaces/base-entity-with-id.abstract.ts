import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType({isAbstract: true})
export abstract class BaseEntityWithIdAbstract {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String, { description: 'id of the entity' })
  id: string;
  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  @Field(() => Date, { description: 'creation date of the entity' })
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  @Field(() => Date, { description: 'update date of the entity' })
  updatedAt: Date;
}
