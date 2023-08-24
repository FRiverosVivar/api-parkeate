import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RequestEntity } from "./entity/request.entity";
import { RequestService } from "./service/request.service";
import { RequestResolver } from "./service/request.resolver";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([RequestEntity])],
  providers: [RequestService, RequestResolver],
  exports: [RequestService, RequestResolver],
})
export class RequestModule {}
