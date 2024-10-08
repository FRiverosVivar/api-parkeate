import { Body, Controller, Post } from "@nestjs/common";
import { PlacesService } from "./places.service";
import { GooglePlacesResponse } from "./places.types";
import { Observable } from "rxjs";
import { AxiosResponse } from "axios";

@Controller("places")
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Post()
  getPlacesByText(
    @Body("text") text: string
  ): Observable<GooglePlacesResponse | AxiosResponse<any, any>> {
    return this.placesService.getPlacesByText(text);
  }
}
