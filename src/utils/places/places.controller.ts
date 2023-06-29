import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { PlacesService } from "./places.service";
import { SearchByTextOptions } from "./places.types";
import { Observable } from "rxjs";
import { SearchPlaceIndexForTextCommandOutput } from "@aws-sdk/client-location";

@Controller("places")
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Post()
  getPlacesByText(@Body('text') text: string, @Body('options') options: SearchByTextOptions): Observable<null> | Observable<SearchPlaceIndexForTextCommandOutput> {
    return this.placesService.getPlacesByText(text, options)
  }
}
