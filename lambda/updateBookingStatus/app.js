import { SchedulerClient, CreateScheduleCommand  } from '@aws-sdk/client-scheduler';
import { axios } from 'axios'
const schedulerClient = new SchedulerClient({ region: 'sa-east-1' });
export const lambdaHandler = async (event) => {

  const env = event.pathParameters.env
  const bookingId = event.queryStringParameters.bookingId
  const nextState = event.queryStringParameters.nextState

  if(!bookingId || bookingId === '' || !nextState || nextState === '') {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required parameters' })
    }
  }
  const parsedNextState = Number(nextState);
  const input = {
    id: bookingId,
    bookingState: parsedNextState,
  };

  const response = await axios.put(`http://${env === 'dev' ? 'api.dev.' : 'api.prod.'}parkeateapp.com/v1/api/bookings/${bookingId}`, input);
  return {
    statusCode: response.status,
    body: response.data
  }
};
