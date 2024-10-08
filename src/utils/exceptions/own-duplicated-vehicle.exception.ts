import { HttpException, HttpStatus } from "@nestjs/common";

export class OwnDuplicatedVehicleException extends HttpException {
  constructor() {
    super(
      HttpException.createBody(
        "You already have a vehicle with that plate",
        "You already have a vehicle with that plate",
        HttpStatus.BAD_REQUEST
      ),
      HttpStatus.BAD_REQUEST
    );
  }
}
