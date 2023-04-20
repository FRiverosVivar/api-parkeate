import { BucketOptions } from './bucket.interface';
import { FileMiddleware } from './file-middleware.interface';
import { S3ClientConfig } from '@aws-sdk/client-s3';

export interface UploaderOptions {
  clientConfig: S3ClientConfig;
  bucketData: BucketOptions;
  middleware: FileMiddleware;
}
export interface FileConfig {
  uploader: UploaderOptions;
}
export interface FileOptions {
  clientConfig: S3ClientConfig;
  bucketData: BucketOptions;
}
