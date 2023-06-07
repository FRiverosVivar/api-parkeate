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
@Injectable()
export class SmsService {
  private readonly SNSClient: SNSClient;
  constructor(private readonly configService: ConfigService) {
    const SNSClientConfig = <SNSClientConfig>(
      this.configService.get<SNSClientConfig>('uploader.sesConfig')
    );
    this.SNSClient = new SNSClient(SNSClientConfig);
  }
  publishSMSToPhoneNumber(phone: string) {
    return from(
      this.SNSClient.send(
        new PublishCommand({
          Message: LOGIN_SECOND_FACTOR_SMS_MESSAGE + lodash.random(1000, 9999),
          PhoneNumber: phone,
        }),
      ),
    );
  }
}
