import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RequestEntity } from "./entity/request.entity";
import { RequestService } from "./service/request.service";
import { RequestResolver } from "./service/request.resolver";
import { EmailService } from "src/utils/email/email.service";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([RequestEntity])],
  providers: [RequestService, RequestResolver, EmailService],
  exports: [RequestService, RequestResolver],
})
export class RequestModule {}
