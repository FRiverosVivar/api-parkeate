import { HttpException, HttpStatus } from "@nestjs/common";

export class DuplicatedParkingInBuildingException extends HttpException {
  constructor() {
    super(
      HttpException.createBody(
        "There is already a Parking with that Position Code",
        "There is already a Parking with that Position Code",
        HttpStatus.BAD_REQUEST
      ),
      HttpStatus.BAD_REQUEST
    );
  }
}
