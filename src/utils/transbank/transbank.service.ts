import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DateTime } from "luxon";
import { from, Observable, of, switchMap } from "rxjs";
import { TransbankEntity } from "src/transbank/entity/transbank.entity";
import { UserEntity } from "src/user/entity/user.entity";
import { UpdateUserInput } from "src/user/model/dto/update-user.input";
import { UserService } from "src/user/service/user.service";
import { WebpayPlus,Oneclick} from "transbank-sdk"; // ES6 Modules
import {
  Options,
  IntegrationApiKeys,
  Environment,
  IntegrationCommerceCodes,
} from "transbank-sdk";
import MallInscription from "transbank-sdk/dist/es5/transbank/webpay/oneclick/mall_inscription";
import { Repository } from "typeorm";

@Injectable()
export class TransbankService {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(TransbankEntity)
    private readonly transbankRepository: Repository<TransbankEntity>
  ) {}

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
  async createInscriptionOneClick(userName: string, email: string, response_url: string): Promise<any> {
    const inscription = new Oneclick.MallInscription(
      new Options(IntegrationCommerceCodes.ONECLICK_MALL, IntegrationApiKeys.WEBPAY, Environment.Integration)
    )
    let startInscription = await inscription.start(userName, email, response_url)
    return {
      url: `${startInscription.url_webpay}?TBK_TOKEN=${startInscription.token}`
    }
  } 

  async confirmInscriptionOneClick(token: string, userId: string): Promise<Observable<MallInscription>> {
    return from(this.userService.findUserById(userId)).pipe(
      switchMap((user) => {
        if (!user) {
          throw new NotFoundException();
        }
        const inscription = new Oneclick.MallInscription(
          new Options(
            IntegrationCommerceCodes.ONECLICK_MALL,
            IntegrationApiKeys.WEBPAY,
            Environment.Integration
          )
        );
  
        return from(inscription.finish(token)).pipe(
          switchMap((response) => {
            const badResponse = response.response_code < 0;
            if (badResponse) {
                throw new BadRequestException(); //TODO: create a custom exception
            }
  
            const newTransbankRecord = this.transbankRepository.create({
              tbk_user: response.tbk_user,
              authorization_code: response.authorization_code,
              card_type: response.card_type,
              card_number: response.card_number.replace(/X/g, ""),
              user: user.id,
            });
            return from(this.transbankRepository.save(newTransbankRecord)).pipe(
              switchMap((t) => {
                const updateUserInput: UpdateUserInput = {
                  id: user.id, 
                  tbkId: t.id 
                };
                return from(this.userService.updateUser(updateUserInput)).pipe(
                  switchMap(() => {
                    return of(response);
                  })
                )
              }),
  
            );
          })
        );
      }),
    );
  }

  async deleteInscriptionOneClick(token: string,username: string,userId: string): Promise<any> {
    const user = this.userService.findUserById(userId)
    if(!user) throw new NotFoundException()

    const inscription = new Oneclick.MallInscription(
      new Options(IntegrationCommerceCodes.ONECLICK_MALL, IntegrationApiKeys.WEBPAY, Environment.Integration)
    )
    let response = await inscription.delete(token,username)
    // let basResponse = response.response_code < 0
    let badResponse = false // testing
    if(badResponse) {
      throw new BadRequestException() //TODO: create a custom exception
    }
   //tbkToken to null
  //  return user.pipe(
  //    switchMap((u) => {
  //       u.tbkToken = null
  //       return from(this.userService.updateUser(u))
  //     })
  //   )


  }
}
