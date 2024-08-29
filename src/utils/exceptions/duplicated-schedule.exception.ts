import { HttpException, HttpStatus } from "@nestjs/common";

export class DuplicatedScheduleException extends HttpException {
  constructor() {
    super(
      HttpException.createBody(
        "You should have only one schedule per day",
        "You should have only one schedule per day",
        HttpStatus.BAD_REQUEST
      ),
      HttpStatus.BAD_REQUEST
    );
  }
}
