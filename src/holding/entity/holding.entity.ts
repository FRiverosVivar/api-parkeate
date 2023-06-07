import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Field, ObjectType } from "@nestjs/graphql";

@Entity('holding')
@ObjectType()
export class HoldingEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String, { description: 'id of the holding' })
  id: string;
  @Column()
  @Field(() => String, { description: 'rut of the holding' })
  rut: string;
  @Column()
  @Field(() => String, { description: 'name of the holding' })
  name: string;
  @Column({ nullable: true })
  @Field(() => String, { description: 'profile photo', nullable: true })
  photo: string;
}