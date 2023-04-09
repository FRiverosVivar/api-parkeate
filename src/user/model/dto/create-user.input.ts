import { InputType, Int, Field, ArgsType } from '@nestjs/graphql';
import { Column } from 'typeorm';
import { UserTypesEnum } from '../../constants/constants';

@InputType()
@ArgsType()
export class CreateUserInput {
  @Field(() => Int, { description: 'type of the user' })
  userType: UserTypesEnum;
  @Field(() => String, { nullable: true})
  manager: string;
  @Field(() => String, {
    description: 'profilePhotoid of the user',
    nullable: true,
  })
  profilePhoto: string;
  @Field(() => String, { description: 'name of the user' })
  name: string;
  @Field(() => String, { description: 'lastname of the user' })
  lastname: string;
  @Field(() => String, { description: 'rut of the user' })
  rut: string;
  @Field(() => String, { description: 'email of the user' })
  email: string;
  @Column()
  @Field(() => String, { description: 'hashed password of the user' })
  password: string;
}
