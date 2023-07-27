#!/bin/bash
set -xe
app = $(/opt/elasticbeanstalk/bin/get-config environment -k APPLICATION_NAME)
echo app
echo app
echo app
echo app
echo app
echo app
echo app
echo app
echo app
echo app

if [ app == "api-dev" ]
then
  npm run start:development
fi
if [ app == "api-staging" ]
then
    npm run start:staging
fi
if [ app == "api-prod" ]
then
  npm run start:prod
fi
