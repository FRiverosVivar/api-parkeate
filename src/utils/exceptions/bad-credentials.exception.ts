import { HttpException, HttpStatus } from "@nestjs/common";

export class BadCredentialsException extends HttpException {
  constructor() {
    super(
      HttpException.createBody(
        "Wrong Credentials",
        "Wrong Credentials, please try again",
        HttpStatus.BAD_REQUEST
      ),
      HttpStatus.BAD_REQUEST
    );
  }
}
