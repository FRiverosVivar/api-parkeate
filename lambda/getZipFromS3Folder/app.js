import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import archiver from 'archiver';
import { DateTime } from 'luxon';
import { PassThrough } from 'stream';

const s3 = new S3Client({ region: 'your-region' });

export const lambdaHandler = async (event) => {
  const bucketName = 'your-bucket-name';
  let folderKey = 'your-folder/'; // Asegúrate de que el key termine con una barra

  if (folderKey.endsWith('/')) {
    folderKey = folderKey.slice(0, -1);
  }

  try {
    const now = DateTime.now().setZone('America/Santiago');
    const formattedDate = now.toFormat('yyyy-MM-dd-HH:mm:ss');

    const listParams = {
      Bucket: bucketName,
      Prefix: `${folderKey}/`
    };

    const listedObjects = await s3.send(new ListObjectsV2Command(listParams));

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No files found in the specified folder' })
      };
    }

    const zipBuffer = await new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const buffers = [];

      archive.on('data', (data) => buffers.push(data));
      archive.on('end', () => resolve(Buffer.concat(buffers)));
      archive.on('error', (err) => reject(err));

      for (const file of listedObjects.Contents) {
        const getObjectParams = { Bucket: bucketName, Key: file.Key };
        const { Body } = await s3.send(new GetObjectCommand(getObjectParams));
        const fileStream = Body.pipe(new PassThrough());
        archive.append(fileStream, { name: file.Key.replace(`${folderKey}/`, '') });
      }

      archive.finalize();
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="folder-${formattedDate}.zip"`
      },
      body: zipBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
