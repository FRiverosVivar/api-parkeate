import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { BaseCustomer } from '../../utils/interfaces/base-customer.abstract';

@InputType()
@ArgsType()
export class CreateClientInput extends BaseCustomer {
  @Field(() => Boolean)
  validatedAccount: boolean;
}
// Aprovado, pendiente , bloqueado y pausado
// Marca, Patente, Color, Modelo - req
