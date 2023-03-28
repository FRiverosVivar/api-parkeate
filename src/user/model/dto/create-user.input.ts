import { InputType, Int, Field, ArgsType } from '@nestjs/graphql';
import { UserTypesEnum } from '../user.constants';

@InputType()
@ArgsType()
export class CreateUserInput {
  @Field(() => Int, { description: 'type of the user' })
  userType: UserTypesEnum;
  @Field(() => String)
  manager: string;
  @Field(() => [String], { description: 'stores of the user' })
  storesId?: string[];

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
}
