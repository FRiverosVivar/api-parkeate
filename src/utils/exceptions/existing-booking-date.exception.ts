import { HttpException, HttpStatus } from '@nestjs/common';

export class ExistingBookingDateException extends HttpException {
  constructor() {
    super(
      HttpException.createBody(
        'There is already a booking in those date range, please select a new date range',
        'There is already a booking in those date range, please select a new date range',
        HttpStatus.BAD_REQUEST,
      ),
      HttpStatus.BAD_REQUEST,
    );
  }
}
