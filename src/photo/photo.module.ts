import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PhotoService } from "./service/photo.service";
import { PhotoEntity } from "./entity/photo.entity";
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PhotoEntity])],
  providers: [PhotoService],
  exports: [PhotoService],
})
export class PhotoModule {}
