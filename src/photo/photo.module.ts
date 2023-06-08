import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PhotoService } from "./service/photo.service";
import { PhotoEntity } from "./entity/photo.entity";
import { ProfilePhotoEntity } from "./entity/profile-photo.entity";
import { MultiplePhotosEntity } from "./entity/multiple-photos.entity";
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PhotoEntity])],
  providers: [PhotoService],
  exports: [PhotoService],
})
export class PhotoModule {}