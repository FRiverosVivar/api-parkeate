import { HttpException, HttpStatus } from '@nestjs/common';

export class UUIDBadFormatException extends HttpException {
  constructor() {
    super(
      HttpException.createBody(
        'The id provided has bad format',
        'Verify the format of the id',
        HttpStatus.BAD_REQUEST,
      ),
      HttpStatus.BAD_REQUEST,
    );
  }
}
