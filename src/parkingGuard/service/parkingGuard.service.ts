import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ParkingGuardEntity } from "../entity/parkingGuard.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Equal, Repository } from "typeorm";
import { Observable, from, map, switchMap } from "rxjs";
import { CreateParkingGuardInput } from "../model/create-parking-guard.input";
import { EmailService } from "src/utils/email/email.service";
import { EmailTypesEnum } from "src/utils/email/enum/email-types.enum";
import { UpdateParkingGuardInput } from "../model/update-parking-guard.input";
import { CryptService } from "src/utils/crypt/crypt.service";
import { UserTypesEnum } from "src/user/constants/constants";
import { UUIDBadFormatException } from "src/utils/exceptions/UUIDBadFormat.exception";
import * as uuid from "uuid";
import {
  PageDto,
  PageOptionsDto,
  PaginationMeta,
} from "src/utils/interfaces/pagination.type";
import { BuildingService } from "src/building/service/building.service";

@Injectable()
export class ParkingGuardService {
  constructor(
    @InjectRepository(ParkingGuardEntity)
    private readonly parkingGuardRepository: Repository<ParkingGuardEntity>,
    private buildingService: BuildingService,
    private emailService: EmailService,
    private cryptService: CryptService
  ) {}
  async createParkingGuard(
    clientDTO: CreateParkingGuardInput
  ): Promise<ParkingGuardEntity> {
    const existingGuard = await this.getParkingGuardByRut(
      clientDTO.rut
    ).toPromise();
    if (existingGuard) {
      throw new BadRequestException();
    }

    const guard = this.parkingGuardRepository.create(clientDTO);
    guard.guardBuildings = [];
    guard.userType = UserTypesEnum.USER;
    const res = await this.emailService.sendEmail(
      EmailTypesEnum.REGISTER,
      guard.email,
      JSON.stringify({ name: guard.fullname })
    );
    const password = guard.password;
    const hashedPassword = await this.cryptService.hash(password).toPromise();
    guard.password = hashedPassword!;
    return this.parkingGuardRepository.save(guard);
  }
  updateClient(
    updatedClient: UpdateParkingGuardInput
  ): Observable<ParkingGuardEntity> {
    return from(
      this.parkingGuardRepository.preload({
        ...updatedClient,
      })
    ).pipe(
      switchMap((guard) => {
        if (!guard) {
          throw new NotFoundException();
        }
        if (updatedClient.password) {
          return this.cryptService.hash(updatedClient.password).pipe(
            switchMap((pw: string) => {
              guard.password = pw;
              return from(this.parkingGuardRepository.save(guard));
            })
          );
        }
        return from(this.parkingGuardRepository.save(guard));
      })
    );
  }
  findParkingGuardByRut(rut: string): Observable<ParkingGuardEntity> {
    return this.getParkingGuardByRut(rut).pipe(
      map((guard) => {
        if (!guard) {
          throw new NotFoundException();
        }
        return guard;
      })
    );
  }
  getParkingGuardByRut(rut: string): Observable<ParkingGuardEntity | null> {
    return from(
      this.parkingGuardRepository.findOne({
        where: {
          rut: rut,
        },
      })
    );
  }
  findGuardById(guardId: string): Observable<ParkingGuardEntity> {
    if (!uuid.validate(guardId)) {
      throw new UUIDBadFormatException();
    }

    return from(
      this.parkingGuardRepository.findOne({
        relations: {
          guardBuildings: true,
        },
        where: {
          id: Equal(guardId),
        },
      })
    ).pipe(
      map((guard) => {
        if (!guard) {
          throw new NotFoundException();
        }
        return guard;
      })
    );
  }
  async getPaginatedGuardsFromBuilding(
    buildingId: string,
    pagination: PageOptionsDto
  ) {
    const guards = await this.parkingGuardRepository.find({
      where: {
        guardBuildings: {
          id: Equal(buildingId),
        },
      },
      skip: pagination.skip,
      take: pagination.take,
      order: {
        createdAt: "DESC",
      },
    });
    const itemCount = guards.length;
    const pageMetaDto = new PaginationMeta({
      pageOptionsDto: pagination,
      itemCount,
    });
    pageMetaDto.skip = (pageMetaDto.page - 1) * pageMetaDto.take;
    return new PageDto(guards, pageMetaDto);
  }
  async assignGuardToBuilding(buildingId: string, guardId: string) {
    const guard = await this.findGuardById(guardId).toPromise();
    const building = await this.buildingService
      .findBuildingById(buildingId)
      .toPromise();
    guard!.guardBuildings.push(building!);
    return this.parkingGuardRepository.save(guard!);
  }
  async unassignGuardToBuilding(buildingId: string, guardId: string) {
    const guard = await this.findGuardById(guardId).toPromise();

    guard!.guardBuildings = guard!.guardBuildings.filter(
      (b) => b.id !== buildingId!
    );
    return this.parkingGuardRepository.save(guard!);
  }
  searchGuardsByGivenRutPhoneNumberOrFullname(text: string, ids: string[]) {
    const query = this.parkingGuardRepository
      .createQueryBuilder("g")
      .where(
        `LOWER(g.fullname) like '%${text.toLowerCase()}%' or LOWER(g.phoneNumber) like '%${text
          .toLowerCase()
          .replace("+", "")
          .replace(
            " ",
            ""
          )}%' or translate(g.rut, '-', '') like '%${text.toLowerCase()}%' or g.rut like '%${text.toLowerCase()}%'`
      );
    return from(query.getMany()).pipe(
      map((guards) => guards.filter((guard) => !ids.includes(guard.id)))
    );
  }
}
