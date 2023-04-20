import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { ValidatePromise } from 'class-validator';
import { GraphQLUpload } from 'graphql-upload-minimal';
import { FilePropertiesDto } from './file-upload.dto';

@InputType()
@ArgsType()
export abstract class FileDto {
  @Field(() => GraphQLUpload)
  @ValidatePromise()
  @Type(() => FilePropertiesDto)
  src: FilePropertiesDto;
}
