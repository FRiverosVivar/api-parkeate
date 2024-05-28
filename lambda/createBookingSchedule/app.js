import { SchedulerClient, CreateScheduleCommand  } from '@aws-sdk/client-scheduler';

const schedulerClient = new SchedulerClient({ region: 'sa-east-1' });
export const lambdaHandler = async (event) => {

  const bookingId = event.pathParameters.bookingId
  const startDateIso = event.pathParameters.startDate
  const nextState = event.pathParameters.nextState
  const env = event.pathParameters.env

  if(!bookingId || bookingId === '' || !startDateIso || startDateIso === '' || !nextState || nextState === '') {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required parameters' })
    }
  }
  const timeZone = event.queryStringParameters.tz;
  const targetInput = {
    pathParameters: {
      env: env ?? 'dev'
    },
    queryStringParameters: {
      bookingId: bookingId,
      nextState: nextState
    }
  }
  const input = {
    Name: `booking-${bookingId}}-${startDateIso}`,
    GroupName: "parkeate-bookings",
    ScheduleExpression: `at(${startDateIso})`,
    Description: "Booking Scheduled Job for Updating Booking Status",
    ScheduleExpressionTimezone: timeZone ? timeZone : "America/Santiago",
    State: "ENABLED",
    Target: {
      Arn: "arn:aws:lambda:sa-east-1:175445123792:function:UpdateBookingStatus",
      RoleArn: "arn:aws:iam::175445123792:role/AWSParkeateLambdaExecutionRole",
      RetryPolicy: {
        MaximumEventAgeInSeconds: Number("30"),
        MaximumRetryAttempts: Number("3"),
      },
      Input: JSON.stringify(targetInput),
    },
    FlexibleTimeWindow: {
      Mode: "OFF",
    },
    ActionAfterCompletion: "DELETE",
  };

  const command = new CreateScheduleCommand(input);
  const response = await schedulerClient.send(command);
  return {
    statusCode: 200,
    body: response['ScheduleArn']
  }
};
