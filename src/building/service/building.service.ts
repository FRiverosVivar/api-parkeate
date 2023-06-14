import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BuildingEntity } from "../entity/building.entity";
import { from, map, Observable, switchMap } from "rxjs";
import { CreateBuildingInput } from "../model/create-building.input";
import { UpdateBuildingInput } from "../model/update-building.input";
import { ExistingIdException } from "../../utils/exceptions/existing-id.exception";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../../utils/exceptions/UUIDBadFormat.exception";

@Injectable()
export class BuildingService {
  constructor(
    @InjectRepository(BuildingEntity)
    private readonly buildingRepository: Repository<BuildingEntity>,
  ) {
  }
  createBuilding(createBuildingInput: CreateBuildingInput): Observable<BuildingEntity> {
    const newBuilding = this.buildingRepository.create(createBuildingInput);
    newBuilding.parkingList = []
    return this.getBuildingByAddress(newBuilding.address)
      .pipe(switchMap((building) => {
        if(building)
          throw new ExistingIdException()

        return from(this.buildingRepository.save(newBuilding));
      }))
  }
  removeBuilding(buildingId: string): Observable<BuildingEntity> {
    if (uuid.validate(buildingId)) {
      throw new UUIDBadFormatException();
    }
    return this.findBuildingById(buildingId).pipe(
      switchMap((b) => {
        return from(this.buildingRepository.remove([b])).pipe(map((b) => b[0]));
      })
    )
  }
  updateBuilding(updateBuildingInput: UpdateBuildingInput): Observable<BuildingEntity> {
    if (!uuid.validate(updateBuildingInput.id)) {
      throw new UUIDBadFormatException();
    }
    return from(
      this.buildingRepository.preload({
        ...updateBuildingInput,
      }),
    ).pipe(
      switchMap((building) => {
        if (!building) {
          throw new NotFoundException();
        }
        return from(this.buildingRepository.save(building));
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

}