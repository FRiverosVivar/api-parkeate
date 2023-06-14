import { ArgsType, Field, InputType } from "@nestjs/graphql";
import { BasicProfileInputAbstract } from "../../utils/interfaces/basic-profile-input.abstract";

@InputType()
@ArgsType()
export class CreateHoldingInput extends BasicProfileInputAbstract {}