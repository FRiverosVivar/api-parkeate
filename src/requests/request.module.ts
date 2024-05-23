import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RequestEntity } from "./entity/request.entity";
import { RequestService } from "./service/request.service";
import { RequestResolver } from "./resolver/request.resolver";
import { EmailService } from "src/utils/email/email.service";
import { registerEnumType } from "@nestjs/graphql";
import { RequestParkingTypeEnum } from "./enum/request-parking-type.enum";
import { RequestStatusEnum } from "./enum/request-status.enum";
import { RequestTypeEnum } from "./enum/request-type.enum";
registerEnumType(RequestParkingTypeEnum, {
  name: 'RequestParkingTypeEnum',
});
registerEnumType(RequestStatusEnum, {
  name: 'RequestStatusEnum',
});
registerEnumType(RequestTypeEnum, {
  name: 'RequestTypeEnum',
});
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([RequestEntity])],
  providers: [RequestService, RequestResolver, EmailService],
  exports: [RequestService, RequestResolver],
})
export class RequestModule {}
