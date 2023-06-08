import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { BaseCustomer } from '../../utils/interfaces/base-customer.abstract';
import { ParkingEntity } from "../../parking/entity/parking.entity";
import { CreateParkingInput } from "../../parking/model/create-parking.input";

@InputType()
@ArgsType()
export class CreateClientInput extends BaseCustomer {
  @Field(() => Boolean)
  validatedAccount: boolean;
}
// Aprovado, pendiente , bloqueado y pausado
// Marca, Patente, Color, Modelo - req
