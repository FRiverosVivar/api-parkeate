import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DateTime } from "luxon";
import { from, Observable, switchMap } from "rxjs";
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

  async confirmInscriptionOneClick(token: string,userId: string): Promise<Observable<UserEntity>> { 
    const user = this.userService.findUserById(userId)
    if(!user) throw new NotFoundException()

    const inscription = new Oneclick.MallInscription(
      new Options(IntegrationCommerceCodes.ONECLICK_MALL, IntegrationApiKeys.WEBPAY, Environment.Integration)
    )    
    let response = await inscription.finish(token)
    let badResponse = response.response_code < 0
    if(badResponse) {
      throw new BadRequestException() //TODO: create a custom exception
    }

    //También deberia ir dentro de un switchmap??
    //Y luego actualizar el user ¿?¿?
    const newTransbankRecord = this.transbankRepository.create({
      tbk_user: response.tbk_user,
      authorization_code: response.authorization_code,
      card_type: response.card_type,
      card_number: response.card_number,
      // user: user //Pendiente cómo guardar el user
    })
    return from(this.transbankRepository.save(newTransbankRecord))
    .pipe(
      switchMap((t) => {
        console.log(t)
        const updateUserInput: UpdateUserInput = {
          id: t.user.id,
          tbkId: t.id
        }
        return from(this.userService.updateUser(updateUserInput))
      })       
    )
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
