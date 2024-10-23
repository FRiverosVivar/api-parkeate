import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DateTime } from "luxon";
import { from, map, Observable, of, switchMap } from "rxjs";
import { TransbankEntity } from "src/transbank/entity/transbank.entity";
import { TransbankModel } from "src/transbank/model/transbank.model";
import { UserEntity } from "src/user/entity/user.entity";
import { UpdateUserInput } from "src/user/model/dto/update-user.input";
import { UserService } from "src/user/service/user.service";
import { WebpayPlus,Oneclick, TransactionDetail} from "transbank-sdk"; // ES6 Modules
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
  getClientCardsData(user: UserEntity): Observable<TransbankModel[]> {    
    return from(this.userService.findUserById(user.id)).pipe(
      switchMap((user) => {
        if (!user) {
          throw new NotFoundException();
        }        
        return from(this.transbankRepository.find({
          where: {
            user: {id: user.id},
            isActive: true
            
          }
        })).pipe(
          map((t) => {
            return t.map((tbk) => {
              return {
                id: tbk.id,
                tbk_user: tbk.tbk_user,
                authorization_code: tbk.authorization_code,
                card_type: tbk.card_type,
                card_number: tbk.card_number,
                isActive: tbk.isActive
              }
            })
          })
        )
      })
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
       // PREGUNTAR MULTI TARJETA EN INSCRIPCION
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
              user: user,
              isActive: true
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
    
    let cardResponse = await this.deleteClientCard(userId)
    if(!cardResponse || cardResponse.isActive){
      throw new BadRequestException()
    }

    return response
  }
    

    //under construction
  async authorizeInscriptionOneClick(token: string, userId: string,amount:number): Promise<any> {
    try{

      const generateBuyOrderCode = () => {
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 10; i++) {
          code += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return "test-0n3Cl1k-"+code;
      };
      const user = await this.userService.findUserById(userId).toPromise(); // Ensure the observable is resolved
      if (!user) {
        throw new NotFoundException();
      }
      let username = user.fullname;
      let montoTest = 50
      const code = generateBuyOrderCode();
      const details = [
        new TransactionDetail(amount, IntegrationCommerceCodes.ONECLICK_MALL_CHILD1,code)
      ]
      
      const tx = new Oneclick.MallTransaction(
        new Options(
          IntegrationCommerceCodes.ONECLICK_MALL,
          IntegrationApiKeys.WEBPAY,
          Environment.Integration
        )
  );
  
    
  const response = await tx.authorize(username,token,code,details);
  
  return response;
}
  catch(e){
    console.log(e)
    throw new BadRequestException();
  }
}

  async deleteClientCard(tbkId: string): Promise<any> {
    try{
      const tbk = await this.transbankRepository.findOne({
        where: {
          id: tbkId
        }
      })
      if (!tbk) throw new NotFoundException();
      //update isActive to false
      tbk.isActive = false
      await this.transbankRepository.save(tbk)
      return tbk
    }
  catch(e){
    console.log(e)
    throw new BadRequestException();
  }
}
}
