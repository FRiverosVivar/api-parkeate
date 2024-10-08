import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PublishCommand,
  SNSClient,
  SNSClientConfig,
} from '@aws-sdk/client-sns';
import { LOGIN_SECOND_FACTOR_SMS_MESSAGE } from './constants/sms-messages';
import * as lodash from 'lodash';
import { from } from 'rxjs';
import { BookingNotificationsEnum } from "../../booking/enum/booking-notifications.enum";
@Injectable()
export class SmsService {
  private readonly SNSClient: SNSClient;
  constructor(private readonly configService: ConfigService) {
    const SNSClientConfig = <SNSClientConfig>(
      this.configService.get<SNSClientConfig>('uploader.sesConfig')
    );
    this.SNSClient = new SNSClient(SNSClientConfig);
  }
  publishSMSToPhoneNumber(phone: string, code: number) {
    return from(
      this.SNSClient.send(
        new PublishCommand({
          Message: LOGIN_SECOND_FACTOR_SMS_MESSAGE + code,
          PhoneNumber: phone,
        }),
      ),
    );
  }
  publishToArrayOfDestinations(phones: string[], type: BookingNotificationsEnum) {

  }
}
