#!/bin/bash
set -xe
if [ "$APPLICATION_NAME" == "api-dev" ]
then
  npm run start:development
else
  if [ "$APPLICATION_NAME" == "api-staging" ]
  then
    npm run start:staging
  else
    if [ "$APPLICATION_NAME" == "api-prod" ]
    then
      npm run start:prod
    fi
  fi
fi
