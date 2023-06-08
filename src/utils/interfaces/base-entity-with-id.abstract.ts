import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Field } from "@nestjs/graphql";

export abstract class BaseEntityWithIdAbstract {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String, { description: 'id of the building' })
  id: string;
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Field(() => Date, { description: 'creation date of the building' })
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Field(() => Date, { description: 'creation date of the building' })
  updatedAt: Date;
}