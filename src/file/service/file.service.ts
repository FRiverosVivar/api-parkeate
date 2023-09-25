import {
  DeleteObjectCommand, GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ClientConfig
} from "@aws-sdk/client-s3";
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { BucketOptions } from '../middleware/bucket.interface';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import * as sharp from 'sharp';
import {
  FileTypesEnum,
  MAX_IMAGE_SIZE,
  MAX_WIDTH,
  QUALITY_ARRAY,
  UPLOADER_OPTIONS,
} from '../constants/file.constants';
import { v4 as uuidV4, v5 as uuidV5 } from 'uuid';
import { RatioEnum } from '../constants/ratio.enum';
import { FileOptions } from '../middleware/uploader.interface';
import { FileUpload } from 'graphql-upload-minimal';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { FileSizeException } from '../../utils/exceptions/file-size.exception';

@Injectable()
export class FileService {
  private readonly client: S3Client;
  private readonly bucketData: BucketOptions | undefined;
  private readonly loggerService: LoggerService;
  public fileTypes = FileTypesEnum;
  constructor(
    @Inject(UPLOADER_OPTIONS) options: FileOptions,
    private readonly configService: ConfigService,
  ) {
    const s3Config = <S3ClientConfig>(
      this.configService.get<S3ClientConfig>('uploader.clientConfig')
    );
    this.client = new S3Client(s3Config);
    this.bucketData = this.configService.get<BucketOptions>(
      'uploader.bucketData',
    );
    this.loggerService = new Logger(FileService.name);
  }
  private validateFileType(mimetype: string): boolean {
    const val = mimetype.split('/');
    const newFileType = val[1];
    return !!Object.values(this.fileTypes).find((type) => type === newFileType);
  }
  private static async streamToBuffer(stream: Readable): Promise<Buffer> {
    const buffer: Uint8Array[] = [];

    return new Promise((resolve, reject) =>
      stream
        .on('error', (error: any) => reject(error))
        .on('data', (data: Uint8Array) => buffer.push(data))
        .on('end', () => resolve(Buffer.concat(buffer))),
    );
  }
  private static async compressImage(
    buffer: Buffer,
    ratio?: number,
  ): Promise<Buffer> {
    let compressBuffer: sharp.Sharp | Buffer = sharp(buffer).jpeg({
      mozjpeg: true,
      chromaSubsampling: '4:4:4',
      force: true,
    });

    if (ratio) {
      compressBuffer.resize({
        width: MAX_WIDTH,
        height: Math.round(MAX_WIDTH * ratio),
        fit: 'cover',
      })
    }

    compressBuffer = await compressBuffer.rotate().toBuffer();
    for (let i = 0; i < QUALITY_ARRAY.length; i++) {
      const quality = QUALITY_ARRAY[i];
      const smallerBuffer = await sharp(compressBuffer)
        .jpeg({
          quality,
          chromaSubsampling: '4:4:4',
          force: true,
        })
        .toBuffer();

      if (smallerBuffer.length <= MAX_IMAGE_SIZE || quality === 10) {
        compressBuffer = smallerBuffer;
        break;
      }
    }

    return compressBuffer;
  }
  private uploadToS3(
    id: string,
    fileBuffer: Buffer,
    fileExt: string,
  ): Observable<string> {
    if (!this.bucketData) {
      throw new InternalServerErrorException();
    }

    const key =
      this.bucketData?.folder +
      '/' +
      uuidV5(this.bucketData?.appUuid, id) +
      '/' +
      uuidV4() +
      fileExt;
    const putObjectOptions = {
      Bucket: this.bucketData.name,
      Body: fileBuffer,
      Key: key,
      ACL: 'public-read',
      ContentType: fileExt,
    };

    return from(this.client.send(new PutObjectCommand(putObjectOptions))).pipe(
      switchMap((output) => {
        if (output && this.bucketData) {
          return of(this.bucketData.url + key);
        }
        throw new InternalServerErrorException();
      }),
    );
  }
  public processFile(
    userId: string,
    file: FileUpload,
    ratio?: RatioEnum,
  ): Observable<string> {
    if (!file) {
      throw new BadRequestException();
    }

    return from(FileService.streamToBuffer(file.createReadStream())).pipe(
      switchMap((buffer) => {
        if (buffer.length > MAX_IMAGE_SIZE) {
          throw new FileSizeException();
        }

        if (this.checkIfMimetypeIsFromImage(file.mimetype.split('/')[1])) {
          return from(FileService.compressImage(buffer, ratio));
        }
        return of(buffer);
      }),
      switchMap((buffer) => {
        return this.uploadToS3(
          userId,
          buffer,
          '.' + file.filename.split('.')[1],
        );
      }),
    );
  }
  private checkIfMimetypeIsFromImage(fileType: string): boolean {
    return (
      fileType === FileTypesEnum.JPG ||
      fileType === FileTypesEnum.JPEG ||
      fileType === FileTypesEnum.PNG
    );
  }
  public deleteFile(url: string): Observable<boolean> {
    if (!this.bucketData) throw new NotFoundException();

    const keyArr = url.split('.com/');

    if (keyArr.length !== 2 || !this.bucketData.url.includes(keyArr[0])) {
      this.loggerService.error('Invalid url to delete file');
    }

    return from(
      this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketData.name,
          Key: keyArr[1],
        }),
      ),
    ).pipe(
      map((value) => {
        if (value) {
          return true;
        }
        throw new NotFoundException();
      }),
    );
  }
  public uploadPDFBufferToS3(clientId: string,pdfBuffer: Buffer, name: string): Observable<string> {
    if (!this.bucketData) {
      throw new InternalServerErrorException();
    }

    const key = 'pdf/' +name
    const putObjectOptions = {
      Bucket: this.bucketData.name,
      Body: pdfBuffer,
      Key: key,
      ACL: 'public-read',
      ContentType: 'application/pdf',
      ServerSideEncryption: 'AES256'
    };
    return from(this.client.send(new PutObjectCommand(putObjectOptions))).pipe(
      switchMap((output) => {
        if (output && this.bucketData) {
          return of(this.bucketData.url + key);
        }
        throw new InternalServerErrorException();
      }),
    );
  }
  getBufferFromFileUpload(file: FileUpload) {
    return FileService.streamToBuffer(file.createReadStream())
  }
}
