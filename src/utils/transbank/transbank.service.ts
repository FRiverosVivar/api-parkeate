import { Injectable } from "@nestjs/common";
import { DateTime } from "luxon";
import { WebpayPlus,Oneclick} from "transbank-sdk"; // ES6 Modules
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
  createInscriptionOneClick(userName: string, email: string, response_url: string): Promise<any> {
    const inscription = new Oneclick.MallInscription(
      new Options(IntegrationCommerceCodes.ONECLICK_MALL, IntegrationApiKeys.WEBPAY, Environment.Integration)
    )
    return inscription.start(userName, email, response_url)
  } 

  confirmInscriptionOneClick(token: string): Promise<any> {
    const inscription = new Oneclick.MallInscription(
      new Options(IntegrationCommerceCodes.ONECLICK_MALL, IntegrationApiKeys.WEBPAY, Environment.Integration)
    )
    // TODO: save response.transback_user in user entity
    //let response = inscription.finish(token)
    return inscription.finish(token)
  }
}
