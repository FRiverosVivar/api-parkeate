import { FileConfig } from './uploader.interface';
import { FileConstants } from '../constants/file.constants';

export function config(): FileConfig {
  const bucketBase = `baseapi-bucket.s3.amazonaws.com/`;

  return {
    uploader: {
      clientConfig: {
        forcePathStyle: false,
        region: FileConstants.BUCKET_REGION,
        credentials: {
          accessKeyId: FileConstants.BUCKET_ACCESS_KEY,
          secretAccessKey: FileConstants.BUCKET_SECRET_KEY,
        },
      },
      bucketData: {
        name: FileConstants.BUCKET_NAME,
        folder: FileConstants.FILE_FOLDER,
        appUuid: FileConstants.SERVICE_ID,
        url: `http://${bucketBase}`,
      },
      middleware: {
        maxFileSize: parseInt(FileConstants.MAX_FILE_SIZE, 10),
        maxFiles: parseInt(FileConstants.MAX_FILES, 10),
      },
    },
  };
}
export default () => config();
