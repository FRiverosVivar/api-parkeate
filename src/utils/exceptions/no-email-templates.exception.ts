import { HttpException, HttpStatus } from '@nestjs/common';

export class NoEmailTemplatesException extends HttpException {
  constructor() {
    super(
      HttpException.createBody(
        'There was no Email Templates found.',
        'The process of sending emails may crash.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      ),
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
