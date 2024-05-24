import { BucketOptions } from './bucket.interface';
import { FileMiddleware } from './file-middleware.interface';
import { S3ClientConfig } from '@aws-sdk/client-s3';
import { SNSClientConfig } from '@aws-sdk/client-sns';
import { SESClientConfig } from '@aws-sdk/client-ses';
import { LocationClientConfig } from "@aws-sdk/client-location";

export interface UploaderOptions {
  sesConfig: SESClientConfig;
  snsConfig: SNSClientConfig;
  clientConfig: S3ClientConfig;
  bucketData: BucketOptions;
  middleware: FileMiddleware;
}
export interface FileConfig {
  uploader: UploaderOptions;
  aws?: {userPoolId: string | undefined, region: string}
}
export interface FileOptions {
  clientConfig: S3ClientConfig;
  bucketData: BucketOptions;
}
