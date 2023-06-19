import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { BasicCustomerInputAbstract } from "../../utils/interfaces/basic-customer-input.abstract";
import { Column } from "typeorm";

@InputType()
@ArgsType()
export class CreateClientInput extends BasicCustomerInputAbstract {

}
