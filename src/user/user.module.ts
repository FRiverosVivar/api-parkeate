import { Global, Module } from "@nestjs/common";
import { UserService } from "./service/user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "./entity/user.entity";
import { UserResolver } from "./resolver/user.resolver";
import { registerEnumType } from "@nestjs/graphql";
import { UserTypesEnum } from "./constants/constants";
import { EmailService } from "../utils/email/email.service";
import { SmsService } from "../utils/sms/sms.service";
import { BaseCustomer } from "../utils/interfaces/base-customer.abstract";
import { PlacesService } from "../utils/places/places.service";
import { CardEntity } from "./entity/card.entity";
import { CardTypesEnum } from "./constants/card-type.enum";
import { HttpModule } from "@nestjs/axios";
import { CryptService } from "src/utils/crypt/crypt.service";
import { ExcelService } from "src/utils/excel/excel.service";

registerEnumType(UserTypesEnum, {
  name: "UserTypesEnum",
});
registerEnumType(CardTypesEnum, {
  name: "CardTypesEnum",
});
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, BaseCustomer, CardEntity]),
    HttpModule,
  ],
  providers: [
    UserResolver,
    UserService,
    EmailService,
    SmsService,
    CryptService,
    ExcelService,
  ],
  exports: [UserService, UserResolver],
})
export class UserModule {}
