import { ArgsType, Field,  ObjectType } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity('transbank')
export class TransbankModel {
    @PrimaryGeneratedColumn('uuid')
    @Field(() => String)
    id: string;
    @Field(() => String)
    tbk_user: string;
    @Field(() => String)
    authorization_code: string;
    @Field(() => String)
    card_type: string;
    @Field(() => String)
    card_number: string;
    @Field(() => Boolean, {nullable: true})
    isActive: boolean;
}