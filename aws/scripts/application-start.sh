#!/bin/bash
set -xe
echo $APPLICATION_NAME
echo $APPLICATION_NAME
echo $APPLICATION_NAME
echo $APPLICATION_NAME
echo $APPLICATION_NAME
if [ "$APPLICATION_NAME" == "api-dev" ]
then
  npm run start:development
fi
if [ "$APPLICATION_NAME" == "api-staging" ]
then
    npm run start:staging
fi
if [ "$APPLICATION_NAME" == "api-prod" ]
then
  npm run start:prod
fi
