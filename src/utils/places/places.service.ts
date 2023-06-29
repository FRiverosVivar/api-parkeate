import { Injectable } from "@nestjs/common";
import {
  SearchByTextOptions,
} from "./places.types";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { FileConstants } from "../../file/constants/file.constants";
import {
  LocationClient,
  SearchPlaceIndexForTextCommand,
  SearchPlaceIndexForTextCommandInput
} from "@aws-sdk/client-location";
import { from, of } from "rxjs";
export const MAPKEY = 'us-east-1:417b0fef-1fce-443d-b615-475fd70ae5c2'

@Injectable()
export class PlacesService {
  locationClient: LocationClient | undefined
  constructor() {
    this.startClient()
  }
  async startClient() {
    const input = {
      IdentityId: MAPKEY,
    }
    this.locationClient = new LocationClient({
      credentials: {
        accessKeyId: FileConstants.BUCKET_ACCESS_KEY,
        secretAccessKey: FileConstants.BUCKET_SECRET_KEY,
      },
      region: FileConstants.BUCKET_REGION,
    })
  }
  getPlacesByText(text: string, options: SearchByTextOptions) {
    if(!this.locationClient)
      return of(null)


    let locationServiceInput: SearchPlaceIndexForTextCommandInput = {
      Text: text,
      IndexName: 'parkingsearch',
    };
    locationServiceInput = {
      ...locationServiceInput,
      ...this.mapSearchOptions(options, locationServiceInput),
    };
    const command = new SearchPlaceIndexForTextCommand(locationServiceInput);
    return from(this.locationClient.send(command));
  }
  mapSearchOptions(options: any, locationServiceInput: SearchPlaceIndexForTextCommandInput ) {
    const locationServiceModifiedInput = { ...locationServiceInput };
    locationServiceModifiedInput.FilterCountries = options.countries;
    locationServiceModifiedInput.FilterCategories = options.categories;
    locationServiceModifiedInput.MaxResults = options.maxResults;

    if (options.searchIndexName) {
      locationServiceModifiedInput.IndexName = options.searchIndexName;
    }

    if (options['biasPosition'] && options['searchAreaConstraints']) {
      throw new Error(
        'BiasPosition and SearchAreaConstraints are mutually exclusive, please remove one or the other from the options object'
      );
    }
    if (options['biasPosition']) {
      locationServiceModifiedInput.BiasPosition = options['biasPosition'];
    }
    if (options['searchAreaConstraints']) {
      locationServiceModifiedInput.FilterBBox = options['searchAreaConstraints'];
    }
    return locationServiceModifiedInput;
  }
}
