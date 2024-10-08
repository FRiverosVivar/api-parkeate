import { HttpStatus, Injectable } from "@nestjs/common";
import { GooglePlacesResponse, SearchByTextOptions } from "./places.types";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { FileConstants } from "../../file/constants/file.constants";
import {
  LocationClient,
  SearchPlaceIndexForTextCommand,
  SearchPlaceIndexForTextCommandInput,
} from "@aws-sdk/client-location";
import { from, map, of } from "rxjs";
import { HttpService } from "@nestjs/axios";
import {
  GooglePlacesDefaultBody,
  GooglePlacesDefaultHeaders,
  GooglePlacesURL,
} from "./places.constants";
import { AxiosResponse, HttpStatusCode } from "axios";

@Injectable()
export class PlacesService {
  constructor(private readonly httpService: HttpService) {}

  getPlacesByText(text: string) {
    if (!text)
      return of({
        places: [],
      });

    const body = {
      ...GooglePlacesDefaultBody,
      textQuery: text,
    };
    return this.httpService
      .post(GooglePlacesURL, body, GooglePlacesDefaultHeaders)
      .pipe(
        map((response: AxiosResponse) => {
          if (response.status === HttpStatus.OK) {
            return {
              ...response.data,
            } as GooglePlacesResponse;
          }
          return response;
        })
      );
  }
  // mapSearchOptions(options: any, locationServiceInput: SearchPlaceIndexForTextCommandInput ) {
  //   const locationServiceModifiedInput = { ...locationServiceInput };
  //   locationServiceModifiedInput.FilterCountries = options.countries;
  //   locationServiceModifiedInput.FilterCategories = options.categories;
  //   locationServiceModifiedInput.MaxResults = options.maxResults;

  //   if (options.searchIndexName) {
  //     locationServiceModifiedInput.IndexName = options.searchIndexName;
  //   }

  //   if (options['biasPosition'] && options['searchAreaConstraints']) {
  //     throw new Error(
  //       'BiasPosition and SearchAreaConstraints are mutually exclusive, please remove one or the other from the options object'
  //     );
  //   }
  //   if (options['biasPosition']) {
  //     locationServiceModifiedInput.BiasPosition = options['biasPosition'];
  //   }
  //   if (options['searchAreaConstraints']) {
  //     locationServiceModifiedInput.FilterBBox = options['searchAreaConstraints'];
  //   }
  //   return locationServiceModifiedInput;
  // }
}
