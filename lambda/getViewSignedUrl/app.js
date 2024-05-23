import { S3Client, GetObjectCommand  } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({ region: "sa-east-1" })
export const lambdaHandler = async (event) => {

  const folderName = event.pathParameters.folder;
  const directorypath = event.pathParameters.item;

  const command = new GetObjectCommand({
    Bucket: folderName,
    Key: directorypath
  });
  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 300
  });

  const response = {
    signedUrl,
    directorypath,
  }
  return {
    statusCode: 200,
    body: signedUrl
  }
};