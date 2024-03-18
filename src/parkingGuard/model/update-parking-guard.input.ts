import { ArgsType, InputType, PartialType } from "@nestjs/graphql";
import { CreateParkingGuardInput } from "./create-parking-guard.input";

@InputType()
@ArgsType()
export class UpdateParkingGuardInput extends PartialType(
  CreateParkingGuardInput
) {}
