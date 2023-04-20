import { IsMimeType, IsString } from 'class-validator';
import { ReadStream } from 'fs';

export abstract class FilePropertiesDto {
  @IsString()
  public filename!: string;

  @IsString()
  @IsMimeType()
  public mimetype!: string;

  @IsString()
  public encoding!: string;

  public createReadStream: () => ReadStream;
}
