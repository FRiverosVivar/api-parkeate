import { Injectable } from "@nestjs/common";
import { DateTime } from "luxon";
import { WebpayPlus } from "transbank-sdk"; // ES6 Modules
import {
  Options,
  IntegrationApiKeys,
  Environment,
  IntegrationCommerceCodes,
} from "transbank-sdk";

@Injectable()
export class TransbankService {
  constructor() {}

  generateMobileTransaction(amount?: number): Promise<any> {
    const tx = new WebpayPlus.Transaction(
      new Options(
        IntegrationCommerceCodes.WEBPAY_PLUS,
        IntegrationApiKeys.WEBPAY,
        Environment.Integration
      )
    );
    return tx.create(
      DateTime.now().toMillis().toString(),
      DateTime.now().toMillis().toString(),
      10,
      "http://localhost:8100/"
    );
  }
  confirmTransaction(token: string): Promise<any> {
    const tx = new WebpayPlus.Transaction(
      new Options(
        IntegrationCommerceCodes.WEBPAY_PLUS,
        IntegrationApiKeys.WEBPAY,
        Environment.Integration
      )
    );
    return tx.commit(token);
  }
  generateTransaction(amount?: number, url?: string) {
    const tx = new WebpayPlus.Transaction(
      new Options(
        IntegrationCommerceCodes.WEBPAY_PLUS,
        IntegrationApiKeys.WEBPAY,
        Environment.Integration
      )
    );
    return tx.create(
      DateTime.now().toMillis().toString(),
      DateTime.now().toMillis().toString(),
      amount ?? 10,
      url ?? "http://parkeateapp.com/"
    );
  }
  transactionStatus(token: string): Promise<any> {
    const tx = new WebpayPlus.Transaction(
      new Options(
        IntegrationCommerceCodes.WEBPAY_PLUS,
        IntegrationApiKeys.WEBPAY,
        Environment.Integration
      )
    );
    return tx.status(token);
  }
}
