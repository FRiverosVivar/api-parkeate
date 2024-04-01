import { ArgsType, InputType } from "@nestjs/graphql";
import { BasicCustomerInputAbstract } from "src/utils/interfaces/basic-customer-input.abstract";

@InputType()
@ArgsType()
export class CreateParkingGuardInput extends BasicCustomerInputAbstract {}
