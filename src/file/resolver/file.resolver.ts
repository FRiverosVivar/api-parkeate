import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { FileService } from '../service/file.service';
import { from, Observable, of, switchMap } from 'rxjs';
import { CreateFileInput } from '../model/dto/create-file.input';
import { FileUpload, GraphQLUpload } from 'graphql-upload-minimal';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Resolver()
export class FileResolver {
  constructor(private readonly fileService: FileService) {}

  @Mutation(() => String)
  uploadFile(
    @Args('createFileInput') createFileInput: CreateFileInput,
    @Args('file', { type: () => GraphQLUpload }) file: FileUpload,
  ): Observable<string> {
    return this.fileService.processFile(
      createFileInput.userId,
      file,
      createFileInput.ratio,
    );
  }
  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  deleteFile(@Args('url') url: string): Observable<boolean> {
    return this.fileService.deleteFile(url);
  }
}
