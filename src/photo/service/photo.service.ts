import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PhotoEntity } from "../entity/photo.entity";
import { forkJoin, from, map, Observable, of, switchMap } from "rxjs";
import { CreatePhotoInput } from "../model/create-photo.input";
import { UpdatePhotoInput } from "../model/update-photo.input";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../../utils/exceptions/UUIDBadFormat.exception";
import { FileService } from "../../file/service/file.service";
import { FileUpload } from "graphql-upload-minimal";

@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(PhotoEntity)
    private readonly photoRepository: Repository<PhotoEntity>,
    private fileService: FileService
  ) {
  }
  createPhoto(createPhotoInput: CreatePhotoInput, file: FileUpload): Observable<PhotoEntity> {
    return this.fileService.processFile(createPhotoInput.creatorId, file).pipe(
      switchMap((url) => {
        if(!url)
          throw new InternalServerErrorException()

        createPhotoInput.url = url;
        const photo = this.photoRepository.create(createPhotoInput);
        return of(photo);
      }),
    );
  }
  removePhoto(photoId: string): Observable<PhotoEntity> {
    return this.findPhotoById(photoId).pipe(
      switchMap((p) => {
        return forkJoin(
          [this.photoRepository.remove(p), this.fileService.deleteFile(p.url)]
        ).pipe(
          map(([v, f]) => {
            return v;
          })
        )
      })
    )
  }
  updatePhoto(updatePhotoInput: UpdatePhotoInput): Observable<PhotoEntity> {
    if (!uuid.validate(updatePhotoInput.id)) {
      throw new UUIDBadFormatException();
    }
    return from(
      this.photoRepository.preload({
        ...updatePhotoInput,
      }),
    ).pipe(
      switchMap((photo) => {
        if (!photo) {
          throw new NotFoundException();
        }
        return from(this.photoRepository.save(photo));
      }),
    );
  }
  findPhotoById(photoId: string): Observable<PhotoEntity> {
    if (!uuid.validate(photoId)) {
      throw new UUIDBadFormatException();
    }
    return this.getPhotoById(photoId).pipe(
      map((p) => {
        if(!p)
          throw new NotFoundException()

        return p;
      })
    )
  }
  getPhotoById(photoId: string): Observable<PhotoEntity | null> {
    return from(
      this.photoRepository.findOne({
        where: {
          id: photoId,
        },
      }),
    );
  }
  getPhotoByUrl(url: string): Observable<PhotoEntity | null> {
    return from(
      this.photoRepository.findOne({
        where: {
          url: url,
        },
      }),
    );
  }
  // getPhotoByAssignedId(assignedId: string): Observable<PhotoEntity | null> {
  //   return from(
  //     this.photoRepository.findOne({
  //       where: {
  //         assignedId: assignedId,
  //       },
  //     }),
  //   );
  // }
}