import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FileService } from "../../file/service/file.service";
import { HoldingEntity } from "../entity/holding.entity";
import { from, map, Observable, of, switchMap } from "rxjs";
import { CreateHoldingInput } from "../model/create-holding.input";
import { UpdateHoldingInput } from "../model/update-holding.input";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../../utils/exceptions/UUIDBadFormat.exception";
import { ExistingIdException } from "../../utils/exceptions/existing-id.exception";
import { FileUpload } from "graphql-upload-minimal";
import { ExistingRutException } from "../../utils/exceptions/ExistingRut.exception";
import { CreatePhotoInput } from "../../photo/model/create-photo.input";
import { UserEntity } from "../../user/entity/user.entity";
import { PhotoService } from "../../photo/service/photo.service";
import { ClientService } from "../../client/service/client.service";

@Injectable()
export class HoldingService {
  constructor(
    @InjectRepository(HoldingEntity)
    private readonly holdingRepository: Repository<HoldingEntity>,
    private readonly clientService: ClientService,
    private photoService: PhotoService
  ) {}
  createHolding(
    createHoldingInput: CreateHoldingInput,
    clientsIds: string[]
  ): Observable<HoldingEntity> {
    const clients = this.clientService.findClientsByIds(clientsIds);
    const newHolding = this.holdingRepository.create(createHoldingInput);
    return this.getHoldingByRut(newHolding.rut).pipe(
      switchMap((holding) => {
        if (holding) throw new ExistingRutException();

        return clients.pipe(
          switchMap((c) => {
            newHolding.clientList = c;
            return from(this.holdingRepository.save(newHolding));
          })
        );
      })
    );
  }
  removeHolding(holdingId: string): Observable<HoldingEntity> {
    if (!uuid.validate(holdingId)) {
      throw new UUIDBadFormatException();
    }
    return from(this.findHoldingById(holdingId)).pipe(
      switchMap((holding) => {
        return from(this.holdingRepository.remove([holding])).pipe(
          map((h) => h[0])
        );
      })
    );
  }
  updateHolding(
    updateHoldingInput: UpdateHoldingInput,
    newClientIds?: string[]
  ): Observable<HoldingEntity> {
    if (!uuid.validate(updateHoldingInput.id)) {
      throw new UUIDBadFormatException();
    }
    return from(
      this.holdingRepository.preload({
        ...updateHoldingInput,
      })
    ).pipe(
      switchMap((holding) => {
        if (!holding) {
          throw new NotFoundException();
        }
        if (newClientIds)
          return this.clientService
            .findClientsByIds(newClientIds)
            .pipe(switchMap((c) => from(this.holdingRepository.save(holding))));

        return from(this.holdingRepository.save(holding));
      })
    );
  }
  findAll(): Observable<HoldingEntity[]> {
    return from(this.holdingRepository.find());
  }
  findHoldingById(holdingId: string): Observable<HoldingEntity> {
    if (!uuid.validate(holdingId)) {
      throw new UUIDBadFormatException();
    }

    return this.getHoldingById(holdingId).pipe(
      map((v) => {
        if (!v) throw new NotFoundException();
        return v;
      })
    );
  }
  getHoldingById(holdingId: string): Observable<HoldingEntity | null> {
    return from(
      this.holdingRepository.findOne({
        where: {
          id: holdingId,
        },
      })
    );
  }
  findHoldingByRut(rut: string): Observable<HoldingEntity> {
    return this.getHoldingByRut(rut).pipe(
      map((v) => {
        if (!v) throw new NotFoundException();
        return v;
      })
    );
  }
  getHoldingByRut(rut: string): Observable<HoldingEntity | null> {
    return from(
      this.holdingRepository.findOne({
        where: {
          rut: rut,
        },
      })
    );
  }
  setProfilePhoto(
    holdingId: string,
    file: FileUpload,
    photoInput: CreatePhotoInput
  ): Observable<HoldingEntity> {
    return this.findHoldingById(holdingId).pipe(
      switchMap((holding: HoldingEntity) => {
        return this.photoService.createPhoto(photoInput, file).pipe(
          switchMap((photo) => {
            if (holding.profilePhoto)
              this.photoService.removePhoto(holding.profilePhoto);

            holding.profilePhoto = photo.url;
            return from(this.holdingRepository.save(holding));
          })
        );
      })
    );
  }
}
