import { HttpException, HttpStatus } from "@nestjs/common";

export class FileSizeException extends HttpException {
  constructor() {
    super(
      HttpException.createBody(
        "The file size is bigger than the max file size accepted, try again.",
        "The file size is bigger than the max file size accepted, try again.",
        HttpStatus.BAD_REQUEST
      ),
      HttpStatus.BAD_REQUEST
    );
  }
}
