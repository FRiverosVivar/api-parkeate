import { HttpException, HttpStatus } from '@nestjs/common';

export class MaxSchedulesException extends HttpException {
  constructor() {
    super(
      HttpException.createBody(
        'You have reached the limit of schedules per week',
        'You have reached the limit of schedules per week',
        HttpStatus.BAD_REQUEST,
      ),
      HttpStatus.BAD_REQUEST,
    );
  }
}
