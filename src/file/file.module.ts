import { DynamicModule, Global, Module } from '@nestjs/common';
import { FileService } from './service/file.service';
import { FileConfig, FileOptions } from './middleware/uploader.interface';
import { UPLOADER_OPTIONS } from './constants/file.constants';
import { FileResolver } from './resolver/file.resolver';
import { registerEnumType } from '@nestjs/graphql';
import { RatioEnum } from './constants/ratio.enum';

registerEnumType(RatioEnum, {
  name: 'RatioEnum',
});
@Global()
@Module({})
export class FileModule {
  public static forRoot(options: FileConfig): DynamicModule {
    return {
      global: true,
      module: FileModule,
      providers: [
        {
          provide: UPLOADER_OPTIONS,
          useValue: options,
        },
        FileService,
        FileResolver,
      ],
      exports: [FileService, FileResolver],
    };
  }
}
