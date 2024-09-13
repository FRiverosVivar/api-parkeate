import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DateTime } from "luxon";
import { from, Observable, switchMap } from "rxjs";
import { UserEntity } from "src/user/entity/user.entity";
import { UserService } from "src/user/service/user.service";
import { WebpayPlus, Oneclick } from "transbank-sdk"; // ES6 Modules
import {
  Options,
  IntegrationApiKeys,
  Environment,
  IntegrationCommerceCodes,
} from "transbank-sdk";

@Injectable()
export class TransbankService {
  constructor(private readonly userService: UserService) {}

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
  async createInscriptionOneClick(
    userName: string,
    email: string,
    response_url: string
  ): Promise<any> {
    const inscription = new Oneclick.MallInscription(
      new Options(
        IntegrationCommerceCodes.ONECLICK_MALL,
        IntegrationApiKeys.WEBPAY,
        Environment.Integration
      )
    );
    let startInscription = await inscription.start(
      userName,
      email,
      response_url
    );
    return {
      url: `${startInscription.url_webpay}?TBK_TOKEN=${startInscription.token}`,
    };
  }

  async confirmInscriptionOneClick(
    token: string,
    userId: string
  ): Promise<Observable<UserEntity>> {
    const user = this.userService.findUserById(userId);
    if (!user) throw new NotFoundException();

    const inscription = new Oneclick.MallInscription(
      new Options(
        IntegrationCommerceCodes.ONECLICK_MALL,
        IntegrationApiKeys.WEBPAY,
        Environment.Integration
      )
    );
    let response = await inscription.finish(token);
    let badResponse = response.response_code < 0;
    if (badResponse) {
      throw new BadRequestException();
    }
    return user.pipe(
      switchMap((u) => {
        console.log(u);
        //u.tbkToken = response.tbk_user;
        return from(this.userService.updateUser(u));
      })
    );
  }

  async deleteInscriptionOneClick(
    token: string,
    username: string,
    userId: string
  ): Promise<Observable<UserEntity>> {
    const user = this.userService.findUserById(userId);
    if (!user) throw new NotFoundException();

    const inscription = new Oneclick.MallInscription(
      new Options(
        IntegrationCommerceCodes.ONECLICK_MALL,
        IntegrationApiKeys.WEBPAY,
        Environment.Integration
      )
    );
    let response = await inscription.delete(token, username);
    let badResponse = false; // testing
    if (badResponse) {
      throw new BadRequestException();
    }
    return user.pipe(
      switchMap((u) => {
        u.tbkToken = undefined;
        return from(this.userService.updateUser(u));
      })
    );
  }
}
