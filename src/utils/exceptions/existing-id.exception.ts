import { HttpException, HttpStatus } from '@nestjs/common';

export class ExistingIdException extends HttpException {
  constructor() {
    super(
      HttpException.createBody(
        'Duplicated Id',
        'The ID property is unique',
        HttpStatus.BAD_REQUEST,
      ),
      HttpStatus.BAD_REQUEST,
    );
  }
}
