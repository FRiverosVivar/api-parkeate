import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { VehicleEntity } from "../entity/vehicle.entity";
import { Like, Repository } from "typeorm";
import { CreateVehicleInput } from "../model/create-vehicle.input";
import { from, map, Observable, switchMap } from "rxjs";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../../utils/exceptions/UUIDBadFormat.exception";
import { OwnDuplicatedVehicleException } from "../../utils/exceptions/own-duplicated-vehicle.exception";
import { UpdateVehicleInput } from "../model/update-vehicle.input";
import { UserService } from "../../user/service/user.service";

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>,
    private readonly userServices: UserService
  ) {}

  createVehicle(
    createVehicleInput: CreateVehicleInput,
    ownerId: string
  ): Observable<VehicleEntity> {
    const vehicle = this.vehicleRepository.create(createVehicleInput);
    const user = this.userServices.findUserById(ownerId);
    return user.pipe(
      switchMap((u) => {
        vehicle.owner = u;
        return this.getVehicleByPlate(vehicle.carPlate).pipe(
          switchMap((v) => {
            if (v) {
              if (v.owner.id === vehicle.owner.id) {
                throw new OwnDuplicatedVehicleException();
              }
              //this.emailService.sendEmail();
            }

            return from(this.vehicleRepository.save(vehicle));
          })
        );
      })
    );
  }
  updateVehicle(
    updateVehicleInput: UpdateVehicleInput
  ): Observable<VehicleEntity> {
    return from(
      this.vehicleRepository.preload({
        ...updateVehicleInput,
      })
    ).pipe(
      switchMap((vehicle) => {
        if (!vehicle) {
          throw new NotFoundException();
        }
        return from(this.vehicleRepository.save(vehicle));
      })
    );
  }
  removeVehicle(vehicleId: string): Observable<VehicleEntity> {
    if (!uuid.validate(vehicleId)) {
      throw new UUIDBadFormatException();
    }
    return from(this.findVehicleById(vehicleId)).pipe(
      switchMap((vehicle) => {
        return from(this.vehicleRepository.remove([vehicle])).pipe(
          map((v) => v[0])
        );
      })
    );
  }
  findVehicleById(vehicleId: string): Observable<VehicleEntity> {
    if (!uuid.validate(vehicleId)) {
      throw new UUIDBadFormatException();
    }
    return this.getVehicleById(vehicleId).pipe(
      map((v) => {
        if (!v) throw new NotFoundException();
        return v;
      })
    );
  }
  findVehiclesByUserId(userId: string): Observable<VehicleEntity[]> {
    if (!uuid.validate(userId)) {
      throw new UUIDBadFormatException();
    }
    return this.getVehiclesByUserId(userId).pipe(
      map((v) => {
        if (!v) throw new NotFoundException();
        return v;
      })
    );
  }
  findVehicleByPlate(plate: string): Observable<VehicleEntity> {
    return this.getVehicleByPlate(plate).pipe(
      map((v) => {
        if (!v) throw new NotFoundException();
        return v;
      })
    );
  }
  getVehicleById(vehicleId: string): Observable<VehicleEntity | null> {
    return from(
      this.vehicleRepository.findOne({
        where: {
          id: vehicleId,
        },
      })
    );
  }
  private getVehicleByPlate(plate: string): Observable<VehicleEntity | null> {
    return from(
      this.vehicleRepository.findOne({
        where: {
          carPlate: plate,
        },
      })
    );
  }
  private getVehiclesByUserId(
    userId: string
  ): Observable<VehicleEntity[] | null> {
    return from(
      this.vehicleRepository.find({
        where: {
          owner: {
            id: userId,
          },
        },
      })
    );
  }
  findVehiclesWithModelPlateOrOwner(text: string) {
    return this.vehicleRepository.find({
      relations: {
        bookings: {
          parking: {
            building: true,
          },
        },
        owner: true,
      },
      where: [
        { model: Like(`%${text}%`) },
        { carPlate: Like(`%${text}%`) },
        { owner: { rut: Like(`%${text}%`) } },
      ],
      order: {
        bookings: {
          dateStart: "DESC",
        },
      },
    });
  }
}
