export const GooglePlacesURL =
  "https://places.googleapis.com/v1/places:searchText";
export const GooglePlacesDefaultHeaders = {
  headers: {
    "X-Goog-Api-Key": "AIzaSyCfgShVsi9zlSSS7q5rf9pMVYGXna5GeVo",
    "X-Goog-FieldMask":
      "places.displayName,places.formattedAddress,places.location",
  },
};
export const GooglePlacesDefaultBody = {
  regionCode: "cl",
  languageCode: "es-419",
  maxResultCount: 10,
};
