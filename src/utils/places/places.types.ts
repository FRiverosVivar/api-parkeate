export interface SearchByTextOptionsBase {
  countries?: string[];
  categories?: string[]
  maxResults?: number;
  searchIndexName?: string;
  providerName?: string;
}
export type Coordinates = [Longitude,Latitude]

// SearchByText options with a bias position
export interface SearchByTextOptionsWithBiasPosition extends SearchByTextOptionsBase {
  biasPosition?: Coordinates;
}

export type Longitude = number;
export type Latitude = number;
export type SearchByTextOptions = | SearchByTextOptionsWithBiasPosition | SearchByTextOptionsWithSearchAreaConstraints;
export type SWLongitude = Longitude;
// SW Latitude point for bounding box
export type SWLatitude = Latitude;
// SW Longitude point for bounding box
export type NELongitude = Longitude;
// SW Latitude point for bounding box
export type NELatitude = Latitude;
// Full Bounding Box point array
export type BoundingBox = [SWLongitude, SWLatitude, NELongitude, NELatitude];
export type SearchByCoordinatesOptions = {
  maxResults?: number;
  searchIndexName?: string;
  providerName?: string;
};
export interface SearchByTextOptionsWithSearchAreaConstraints
  extends SearchByTextOptionsBase {
  searchAreaConstraints?: BoundingBox;
}
export type searchByPlaceIdOptions = {
  searchIndexName?: string;
};

