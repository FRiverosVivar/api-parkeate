import { InjectRepository } from "@nestjs/typeorm";
import { ParkingEntity } from "../entity/parking.entity";
import { Not, Repository } from "typeorm";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { combineLatest, forkJoin, from, map, Observable, switchMap, tap } from "rxjs";
import { CreateParkingInput } from "../model/create-parking.input";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../../utils/exceptions/UUIDBadFormat.exception";
import { UpdateParkingInput } from "../model/update-parking.input";
import { DuplicatedParkingInBuildingException } from "../../utils/exceptions/duplicated-parking-in-building.exception";
import { ClientService } from "../../client/service/client.service";
import { UserService } from "../../user/service/user.service";
import { BuildingService } from "../../building/service/building.service";
import { TagsService } from "../../tags/service/tags.service";
import { ClientEntity } from "../../client/entity/client.entity";
import { PhotoService } from "../../photo/service/photo.service";
import { CreatePhotoInput } from "../../photo/model/create-photo.input";
import { FileUpload } from "graphql-upload-minimal";

@Injectable()
export class ParkingService {
  constructor(
    @InjectRepository(ParkingEntity)
    private readonly parkingRepository: Repository<ParkingEntity>,
    private readonly clientService: ClientService,
    private readonly userService: UserService,
    private readonly buildingService: BuildingService,
    private readonly tagsService: TagsService,
    private readonly photoService: PhotoService
  ) {
  }
  createParking(createParkingInput: CreateParkingInput, buildingId: string, tagsIds: string[], clientId?: string, userId?: string): Observable<ParkingEntity> {
    const parking = this.parkingRepository.create(createParkingInput)
    const tags = this.tagsService.findAllTagsByIds(tagsIds);
    const building = this.buildingService.findBuildingById(buildingId);
    const owner = clientId ? this.clientService.findClientById(clientId) : userId ? this.userService.findUserById(userId) : undefined;
    if(!owner)throw new BadRequestException();

    return this.findParkingByBuildingPositionCode(parking.buildingPositionCode).pipe(
      switchMap((p) => {
        if(p)
          throw new DuplicatedParkingInBuildingException()

        return forkJoin(
          [
            tags,
            building,
            owner
          ]
        ).pipe(
          switchMap(([t, b, o]) => {
            parking.tags = t;
            parking.building = b;
            if(o instanceof ClientEntity)
              parking.clientOwner = o;
            else
              parking.userOwner = o;

            parking.blockedUsers = [];
            parking.schedule = [];

            return from(this.parkingRepository.save(parking))
          }));
      })
    )
  }
  removeParking(parkingId: string): Observable<ParkingEntity> {
    if (uuid.validate(parkingId)) {
      throw new UUIDBadFormatException();
    }
    return this.findParkingById(parkingId).pipe(
      switchMap((p) => {
        return from(this.parkingRepository.remove([p])).pipe(map((p) => p[0]));
      })
    )
  }
  updateParking(updateParkingInput: UpdateParkingInput, buildingId?: string, tagsIds?: string[]): Observable<ParkingEntity> {
    return from(
      this.parkingRepository.preload({
        ...updateParkingInput,
      }),
    ).pipe(
      switchMap((parking) => {
        if (!parking) {
          throw new NotFoundException();
        }

        if (buildingId && tagsIds) {
          const building$ = this.buildingService.findBuildingById(buildingId);
          const tags$ = this.tagsService.findAllTagsByIds(tagsIds);

          return combineLatest([building$, tags$]).pipe(
            tap(([building, tags]) => {
              parking.building = building;
              parking.tags = tags;
            }),
            switchMap(() => from(this.parkingRepository.save(parking)))
          );
        } else if (buildingId) {
          return this.buildingService.findBuildingById(buildingId).pipe(
            tap((building) => {
              parking.building = building;
            }),
            switchMap(() => from(this.parkingRepository.save(parking)))
          );
        } else if (tagsIds) {
          return this.tagsService.findAllTagsByIds(tagsIds).pipe(
            tap((tags) => {
              parking.tags = tags;
            }),
            switchMap(() => from(this.parkingRepository.save(parking)))
          );
        }

        return from(this.parkingRepository.save(parking));
      }),
    );
  }
  findAllReservableParkings(userId: string): Observable<ParkingEntity[]> {
    return from(
      this.parkingRepository.find(
        {
          where: {
            blockedUsers : {
              id: Not(userId)
            },
            blocked: false
          }
        }
      )
    )
  }
  findAllParkings(): Observable<ParkingEntity[]> {
    return from(this.parkingRepository.find());
  }
  findParkingByBuildingPositionCode(code: string): Observable<ParkingEntity> {
    if(code === '')
      throw new BadRequestException()

    return this.getParkingByBuildingPositionCode(code).pipe(
      map((p) => {
        if(!p)
          throw new NotFoundException()

        return p;
      })
    )
  }
  findParkingById(parkingId: string): Observable<ParkingEntity> {
    if (uuid.validate(parkingId)) {
      throw new UUIDBadFormatException();
    }

    return this.getParkingById(parkingId).pipe(
      map((p) => {
        if(!p)
          throw new NotFoundException()

        return p;
      })
    )
  }
  findParkingByBuildingId(buildingId: string): Observable<ParkingEntity> {
    if (uuid.validate(buildingId)) {
      throw new UUIDBadFormatException();
    }

    return this.getParkingByBuildingId(buildingId).pipe(
      map((p) => {
        if(!p)
          throw new NotFoundException()

        return p;
      })
    )
  }
  setParkingPhoto(parkingId: string, createPhotoInput: CreatePhotoInput, file: FileUpload) : Observable<ParkingEntity> {
    return this.findParkingById(parkingId).pipe(
      switchMap((p) => {
        return this.photoService.createPhoto(createPhotoInput, file).pipe(
          switchMap((photo) => {
            p.photo = photo.url;
            return this.parkingRepository.save(p)
          })
        )
      })
    )
  }
  private getParkingByBuildingPositionCode(code: string): Observable<ParkingEntity | null> {
    return from(
      this.parkingRepository.findOne({
        where: {
          buildingPositionCode: code,
        },
      }),
    );
  }
  private getParkingById(id: string): Observable<ParkingEntity | null> {
    return from(
      this.parkingRepository.findOne({
        where: {
          id: id,
        },
      }),
    );
  }
  private getParkingByBuildingId(buildingId: string): Observable<ParkingEntity | null> {
    return from(
      this.parkingRepository.findOne({
        where: {
          building: {
            id: buildingId
          },
        },
      }),
    );
  }
}