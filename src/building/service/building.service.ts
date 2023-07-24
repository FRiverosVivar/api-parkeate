import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BuildingEntity } from "../entity/building.entity";
import { forkJoin, from, map, Observable, switchMap, tap } from "rxjs";
import { CreateBuildingInput } from "../model/create-building.input";
import { UpdateBuildingInput } from "../model/update-building.input";
import { ExistingIdException } from "../../utils/exceptions/existing-id.exception";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../../utils/exceptions/UUIDBadFormat.exception";
import { ClientService } from "../../client/service/client.service";
import { UserEntity } from "../../user/entity/user.entity";
import { PointInput } from "../../parking/model/point.input";
import { FiltersInput } from "../../parking/model/filters.input";
import { ParkingOutput } from "../../parking/model/parking.output";
import { CreatePhotoInput } from "../../photo/model/create-photo.input";
import { FileUpload } from "graphql-upload-minimal";
import { ParkingEntity } from "../../parking/entity/parking.entity";
import { PhotoService } from "../../photo/service/photo.service";
import { TagsEntity } from "../../tags/entity/tags.entity";
import { TagsService } from "../../tags/service/tags.service";
import { BuildingOutput } from "../model/building.output";
import { ParkingType } from "../../parking/model/parking-type.enum";

@Injectable()
export class BuildingService {
  constructor(
    @InjectRepository(BuildingEntity)
    private readonly buildingRepository: Repository<BuildingEntity>,
    private readonly clientService: ClientService,
    private readonly tagsService: TagsService,
    private readonly photoService: PhotoService
  ) {
  }
  createBuilding(createBuildingInput: CreateBuildingInput, ownerId: string, tags: string[]): Observable<BuildingEntity> {
    const client = this.clientService.findClientById(ownerId);
    const newBuilding = this.buildingRepository.create(createBuildingInput);
    const tags$ = this.tagsService.findAllTagsByIds(tags)
    newBuilding.parkingList = []
    const subject = forkJoin([tags$,client,this.getBuildingByAddress(newBuilding.address)])
    return subject
      .pipe(switchMap(([tags, client, building]) => {
        if(building)
          throw new ExistingIdException()
        newBuilding.tags = tags
        newBuilding.client = client;
        return from(this.buildingRepository.save(newBuilding));
      }))
  }
  removeBuilding(buildingId: string): Observable<BuildingEntity> {
    if (!uuid.validate(buildingId)) {
      throw new UUIDBadFormatException();
    }
    return this.findBuildingById(buildingId).pipe(
      switchMap((b) => {
        return from(this.buildingRepository.remove([b])).pipe(map((b) => b[0]));
      })
    )
  }
  updateBuilding(updateBuildingInput: UpdateBuildingInput, tags?: string[]): Observable<BuildingEntity> {
    if (!uuid.validate(updateBuildingInput.id)) {
      throw new UUIDBadFormatException();
    }
    let tags$: Observable<TagsEntity[]> | undefined
    if(tags && tags.length > 0)
      tags$ = this.tagsService.findAllTagsByIds(tags)
    return from(
      this.buildingRepository.preload({
        ...updateBuildingInput,
      }),
    ).pipe(
      switchMap((b) => {
        if (!b) {
          throw new NotFoundException();
        }

        if(tags$)
          return tags$.pipe(
            switchMap((tags) => {
              b.tags = tags
              return from(this.buildingRepository.save(b));
            })
          )
        return from(this.buildingRepository.save(b));
      }),
    );
  }
  private getBuildingById(buildingId: string): Observable<BuildingEntity | null> {
    return from(
      this.buildingRepository.findOne({
        where: {
          id: buildingId,
        },
      }),
    );
  }
  private getBuildingByAddress(address: string): Observable<BuildingEntity | null> {
    return from(
      this.buildingRepository.findOne({
        where: {
          address: address,
        },
      }),
    );
  }
  findBuildingByAddress(address: string): Observable<BuildingEntity> {
    return this.getBuildingByAddress(address).pipe(
      map((v) => {
        if(!v)
          throw new NotFoundException()
        return v;
      })
    )
  }
  findBuildingById(buildingId: string): Observable<BuildingEntity> {
    if (!uuid.validate(buildingId)) {
      throw new UUIDBadFormatException();
    }

    return this.getBuildingById(buildingId).pipe(
      map((v) => {
        if(!v)
          throw new NotFoundException()

        return v;
      })
    )
  }
  findBuildingsByClientId(clientId: string): Observable<BuildingEntity[]> {
      if (!uuid.validate(clientId)) {
        throw new UUIDBadFormatException();
      }
      return this.getBuildingsByClientId(clientId).pipe(
        map((v) => {
          if(!v)
            throw new NotFoundException()
          return v;
        })
      )
  }
  getBuildingsByClientId(clientId: string): Observable<BuildingEntity[] | null> {
    return from(this.buildingRepository.find({
      where: {
        client: {
          id: clientId
        }
      }
    }))
  }
  setBuildingPhoto(buildingId: string, createPhotoInput: CreatePhotoInput, file: FileUpload | undefined) : Observable<BuildingEntity> {
    if(!file)
      throw new BadRequestException()

    return this.findBuildingById(buildingId).pipe(
      switchMap((b) => {
        return this.photoService.createPhoto(createPhotoInput, file).pipe(
          tap((photo) => {
            if(b.photo)
              this.photoService.removePhoto(b.photo)
          }),
          switchMap((photo) => {
            b.photo = photo.url;
            return this.buildingRepository.save(b)
          })
        )
      })
    )
  }
  getAllNearbyAndReservableBuildings(user: UserEntity, point: PointInput, distance: number, parkingType?: ParkingType): Observable<BuildingOutput[]> {
    const query = `
      select * from
      get_nearby_and_available_buildings('${user.id}', ${point.coordinates[0]}, ${point.coordinates[1]}, ${distance} , ${parkingType ? parkingType: -1})
      `
    console.log(query)
    return from(this.buildingRepository.query(query))
  }
  // private createWhereClause(filters?: FiltersInput): string {
  //   if(!filters) return '';
  //   const conditions = [];
  //
  //   if (filters.priceMonthly !== undefined) {
  //     conditions.push(`priceMonthly = ${filters.priceMonthly}`);
  //   }
  //
  //   if (filters.pricePerMinute !== undefined) {
  //     conditions.push(`pricePerMinute = ${filters.pricePerMinute}`);
  //   }
  //
  //   if (filters.parkingType !== undefined) {
  //     conditions.push(`type = ${filters.parkingType}`);
  //   }
  //
  //   if (conditions.length === 0) {
  //     return '';
  //   }
  //
  //   const whereClause = conditions.join(' AND ');
  //   return `WHERE ${whereClause}`;
  // }
}
