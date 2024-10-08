import { ArgsType, Field, InputType, Int } from "@nestjs/graphql";
import { FileDto } from "./image.dto";
import { RatioEnum } from "../../constants/ratio.enum";

@InputType()
@ArgsType()
export class CreateFileInput {
  @Field(() => String)
  userId: string;
  @Field(() => RatioEnum, { nullable: true })
  ratio?: RatioEnum;
}
