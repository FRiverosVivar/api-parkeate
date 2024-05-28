import { SchedulerClient, CreateScheduleCommand  } from '@aws-sdk/client-scheduler';

const schedulerClient = new SchedulerClient({ region: 'sa-east-1' });
export const lambdaHandler = async (event) => {

  const bookingId = event.pathParameters.bookingId
  const startDateIso = event.pathParameters.startDate

  if(!bookingId || bookingId === '' || !startDateIso || startDateIso === '') {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required parameters' })
    }
  }
  const timeZone = event.queryStringParameters.tz;

  const input = {
    Name: `booking-${bookingId}}`, // required
    GroupName: "parkeate-bookings",
    ScheduleExpression: `at(${startDateIso})`,
    Description: "Booking Scheduled Job for Updating Booking Status",
    ScheduleExpressionTimezone: timeZone ? timeZone : "America/Santiago",
    State: "ENABLED",
    Target: {
      Arn: "STRING_VALUE",
      RoleArn: "STRING_VALUE",
      RetryPolicy: {
        MaximumEventAgeInSeconds: Number("30"),
        MaximumRetryAttempts: Number("3"),
      },
      Input: "STRING_VALUE",
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
