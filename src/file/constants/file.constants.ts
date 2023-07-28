export const FileConstants = {
  BUCKET_REGION: 'sa-east-1',
  BUCKET_HOST: 's3.sa-east-1.amazonaws',
  BUCKET_SECRET_KEY: '19s43DsL2rPJC3OIz/4a5i0CzmpZ8AAJrk/4mX/m',
  BUCKET_NAME: 'api-photos',
  BUCKET_ACCESS_KEY: 'AKIASRWKYELIBKACY673',
  FILE_FOLDER: 'files',
  SERVICE_ID: 'test',
  MAX_FILE_SIZE: '100000000', //100mb
  MAX_FILES: '1',
};
export const MAX_WIDTH = 2160;
export const QUALITY_ARRAY = [
  90, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10,
];
export const MAX_IMAGE_SIZE = 10000000; //10mb
export const MAX_IMPORT_CSV_SIZE = 100000000 - 1; //99.9mb
export const UPLOADER_OPTIONS = 'UPLOADER_OPTIONS';
export enum FileTypesEnum {
  JPEG = 'jpeg',
  JPG = 'jpg',
  PNG = 'png',
  PDF = 'pdf',
  CSV = 'csv',
  XLS = 'vnd.ms-excel',
  XLSX = 'vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PPT = 'vnd.ms-powerpoint',
  PPTX = 'vnd.openxmlformats-officedocument.presentationml.presentation',
  DOC = 'msword',
  DOCX = 'vnd.openxmlformats-officedocument.wordprocessingml.document',
  JSON = 'json',
}
