import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from '../utils/email/email.service';
import { SmsService } from '../utils/sms/sms.service';
import { ClientEntity } from './entity/client.entity';
import { ClientService } from './service/client.service';
import { ClientResolver } from './resolver/client.resolver';
import { registerEnumType } from "@nestjs/graphql";
import { BankAccountTypeEnum, BanksEnum } from "./model/bank.enum";

registerEnumType(BanksEnum,{
  name: 'BanksEnum'
})
registerEnumType(BankAccountTypeEnum,{
  name: 'BanksAccountTypeEnum'
})
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ClientEntity])],
  providers: [ClientResolver, EmailService, SmsService, ClientService],
  exports: [ClientService, ClientResolver],
})
export class ClientModule {}
