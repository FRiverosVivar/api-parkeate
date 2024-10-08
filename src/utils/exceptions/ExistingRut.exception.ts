import { HttpException, HttpStatus } from "@nestjs/common";

export class ExistingRutException extends HttpException {
  constructor() {
    super(
      HttpException.createBody(
        "Duplicated RUT",
        "The RUT property is unique",
        HttpStatus.BAD_REQUEST
      ),
      HttpStatus.BAD_REQUEST
    );
  }
}
