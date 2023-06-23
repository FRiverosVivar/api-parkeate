import { HttpException, HttpStatus } from '@nestjs/common';

export class NotValidatedAccountException extends HttpException {
  constructor() {
    super(
      HttpException.createBody(
        'Your account is not validated, please contact support@parkeate.app.',
        'Your account is not validated, please contact support@parkeate.app.',
        HttpStatus.NOT_ACCEPTABLE,
      ),
      HttpStatus.NOT_ACCEPTABLE,
    );
  }
}
