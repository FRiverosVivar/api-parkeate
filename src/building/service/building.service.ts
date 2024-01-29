import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BuildingEntity } from "../entity/building.entity";
import { forkJoin, from, map, Observable, of, switchMap, tap } from "rxjs";
import { CreateBuildingInput } from "../model/create-building.input";
import { UpdateBuildingInput } from "../model/update-building.input";
import { ExistingIdException } from "../../utils/exceptions/existing-id.exception";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../../utils/exceptions/UUIDBadFormat.exception";
import { ClientService } from "../../client/service/client.service";
import { UserEntity } from "../../user/entity/user.entity";
import { PointInput } from "../../parking/model/point.input";
import { CreatePhotoInput } from "../../photo/model/create-photo.input";
import { FileUpload } from "graphql-upload-minimal";
import { PhotoService } from "../../photo/service/photo.service";
import { TagsEntity } from "../../tags/entity/tags.entity";
import { TagsService } from "../../tags/service/tags.service";
import { BuildingOutput } from "../model/building.output";
import { ParkingType } from "../../parking/model/parking-type.enum";
import * as _ from "lodash";
import {
  PageDto,
  PageOptionsDto,
  PaginationMeta,
} from "../../utils/interfaces/pagination.type";
import { ClientEntity } from "../../client/entity/client.entity";
import { UserTypesEnum } from "../../user/constants/constants";
import { BuildingWithCoordsOutput } from "../model/building-coords.output";
import {
  FinalPrice,
  MonthlyBuildingProfit,
  MonthlyFinalPrice,
  MostProfitableBuilding,
  WeeklyBuildingProfit,
} from "../model/finance-building.output";
import { DateTime } from "luxon";

@Injectable()
export class BuildingService {
  constructor(
    @InjectRepository(BuildingEntity)
    private readonly buildingRepository: Repository<BuildingEntity>,
    private readonly clientService: ClientService,
    private readonly tagsService: TagsService,
    private readonly photoService: PhotoService
  ) {}
  createBuilding(
    createBuildingInput: CreateBuildingInput,
    ownerId: string,
    tags: string[]
  ): Observable<BuildingEntity> {
    const client = this.clientService.findClientById(ownerId);
    const newBuilding = this.buildingRepository.create(createBuildingInput);
    newBuilding.active = false;
    const tags$ = this.tagsService.findAllTagsByIds(tags);
    newBuilding.parkingList = [];
    const subject = forkJoin([
      tags$,
      client,
      this.getBuildingByAddress(newBuilding.address),
    ]);
    return subject.pipe(
      switchMap(([tags, client, building]) => {
        if (building) throw new ExistingIdException();
        newBuilding.tags = tags;
        newBuilding.client = client;
        return from(this.buildingRepository.save(newBuilding));
      })
    );
  }
  removeBuilding(buildingId: string): Observable<BuildingEntity> {
    if (!uuid.validate(buildingId)) {
      throw new UUIDBadFormatException();
    }
    return this.findBuildingById(buildingId).pipe(
      switchMap((b) => {
        return from(this.buildingRepository.remove([b])).pipe(map((b) => b[0]));
      })
    );
  }
  updateBuilding(
    updateBuildingInput: UpdateBuildingInput,
    tags?: string[]
  ): Observable<BuildingEntity> {
    if (!uuid.validate(updateBuildingInput.id)) {
      throw new UUIDBadFormatException();
    }
    let tags$: Observable<TagsEntity[]> | undefined;
    if (tags && tags.length > 0)
      tags$ = this.tagsService.findAllTagsByIds(tags);
    return from(
      this.buildingRepository.preload({
        ...updateBuildingInput,
      })
    ).pipe(
      switchMap((b) => {
        if (!b) {
          throw new NotFoundException();
        }

        if (tags$)
          return tags$.pipe(
            switchMap((tags) => {
              b.tags = tags;
              return from(this.buildingRepository.save(b));
            })
          );
        return from(this.buildingRepository.save(b));
      })
    );
  }
  async findPaginatedBuildings(pagination: PageOptionsDto, user: ClientEntity) {
    const query = this.buildingRepository
      .createQueryBuilder("buildings")
      .leftJoinAndSelect("buildings.client", "c")
      .leftJoinAndSelect("buildings.tags", "t")
      .where(
        user.userType < UserTypesEnum.ADMIN ? `c.id = '${user.id}'::uuid` : ""
      )
      .orderBy("buildings.createdAt", "DESC")
      .skip(pagination.skip)
      .take(pagination.take);
    const itemCount = await query.getCount();
    const { entities } = await query.getRawAndEntities();
    const pageMetaDto = new PaginationMeta({
      pageOptionsDto: pagination,
      itemCount,
    });
    pageMetaDto.skip = (pageMetaDto.page - 1) * pageMetaDto.take;
    return new PageDto(entities, pageMetaDto);
  }
  private getBuildingById(
    buildingId: string
  ): Observable<BuildingEntity | null> {
    return from(
      this.buildingRepository.findOne({
        where: {
          id: buildingId,
        },
      })
    );
  }
  private getBuildingWithCoordsById(
    buildingId: string
  ): Observable<BuildingWithCoordsOutput | null> {
    return from(
      this.buildingRepository.findOne({
        where: {
          id: buildingId,
        },
        relations: {
          parkingList: true,
          tags: true,
        },
      })
    ).pipe(
      switchMap((b) => {
        if (b) {
          const query = `
          select b.id, concat(ST_Y(ST_AsText(b.location)), ',', ST_X(ST_AsText(b.location))) as coords
          from building as b where b.id = '${b.id}'::uuid
        `;
          return from(this.buildingRepository.query(query)).pipe(
            switchMap((bWithCoords: BuildingWithCoordsOutput[]) => {
              if (bWithCoords && bWithCoords.length > 0) {
                const buildingOutput: BuildingWithCoordsOutput = {
                  coords: bWithCoords[0].coords,
                  ...b,
                };
                return of(buildingOutput);
              }
              return of(null);
            })
          );
        }
        return of(null);
      })
    );
  }
  private getBuildingByAddress(
    address: string
  ): Observable<BuildingEntity | null> {
    return from(
      this.buildingRepository.findOne({
        where: {
          address: address,
        },
      })
    );
  }
  findBuildingByAddress(address: string): Observable<BuildingEntity> {
    return this.getBuildingByAddress(address).pipe(
      map((v) => {
        if (!v) throw new NotFoundException();
        return v;
      })
    );
  }
  findBuildingById(buildingId: string): Observable<BuildingEntity> {
    if (!uuid.validate(buildingId)) {
      throw new UUIDBadFormatException();
    }

    return this.getBuildingById(buildingId).pipe(
      map((v) => {
        if (!v) throw new NotFoundException();

        return v;
      })
    );
  }
  findBuildingWithCoordsById(
    buildingId: string
  ): Observable<BuildingWithCoordsOutput> {
    if (!uuid.validate(buildingId)) {
      throw new UUIDBadFormatException();
    }

    return this.getBuildingWithCoordsById(buildingId).pipe(
      map((v) => {
        if (!v) throw new NotFoundException();

        return v;
      })
    );
  }
  findBuildingByIdAndFilterParkingsByReservedStatus(
    buildingId: string
  ): Observable<BuildingEntity> {
    if (!uuid.validate(buildingId)) {
      throw new UUIDBadFormatException();
    }

    return this.findBuildingById(buildingId).pipe(
      map((b) => {
        const buildingParkings = b.parkingList;
        b.parkingList = _.filter(buildingParkings, (p) => !p.reserved);
        return b;
      })
    );
  }
  findBuildingsByClientId(clientId: string): Observable<BuildingEntity[]> {
    if (!uuid.validate(clientId)) {
      throw new UUIDBadFormatException();
    }
    return this.getBuildingsByClientId(clientId).pipe(
      map((v) => {
        if (!v) throw new NotFoundException();
        return v;
      })
    );
  }
  getBuildingsByClientId(
    clientId: string
  ): Observable<BuildingEntity[] | null> {
    return from(
      this.buildingRepository.find({
        where: {
          client: {
            id: clientId,
          },
        },
      })
    );
  }

  setBuildingPhoto(
    buildingId: string,
    createPhotoInput: CreatePhotoInput,
    file: FileUpload | undefined
  ): Observable<BuildingEntity> {
    if (!file) throw new BadRequestException();

    return this.findBuildingById(buildingId).pipe(
      switchMap((b) => {
        return this.photoService.createPhoto(createPhotoInput, file).pipe(
          tap((photo) => {
            if (b.photo) this.photoService.removePhoto(b.photo);
          }),
          switchMap((photo) => {
            b.photo = photo.url;
            return this.buildingRepository.save(b);
          })
        );
      })
    );
  }
  findMostProfitableBuilding() {
    const todayStart = DateTime.now().set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 1,
    });
    const todayEnd = DateTime.now().set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    });
    const query = this.buildingRepository
      .createQueryBuilder("b")
      .leftJoinAndSelect("b.client", "c")
      .leftJoinAndSelect("b.parkingList", "p")
      .leftJoinAndSelect("p.bookings", "bookings")
      .select(`b.id, SUM(bookings."finalPrice") as "finalPrice"`)
      .where(
        `bookings."dateStart" BETWEEN '${todayStart.toISO()}' AND '${todayEnd.toISO()}'`
      )
      .andWhere(`bookings."bookingState" = 3`)
      .andWhere(`bookings.paid = TRUE`)
      .groupBy("b.id")
      .orderBy(`"finalPrice"`, "DESC")
      .limit(1);
    return from(query.getRawOne()).pipe(
      switchMap((b) => {
        if (!b) return of(null);
        return this.findBuildingById(b.id).pipe(
          map((building) => {
            const mostProfitableBuilding: MostProfitableBuilding = {
              building: building,
              totalPrice: b.finalPrice,
            };
            return mostProfitableBuilding;
          })
        );
      })
    );
  }
  async findAllProfitOfAllBuildingsGivenADate(
    date: DateTime
  ): Promise<FinalPrice | undefined> {
    console.log(
      this.buildingRepository
        .createQueryBuilder("b")
        .leftJoinAndSelect("b.client", "c")
        .leftJoinAndSelect("b.parkingList", "p")
        .leftJoinAndSelect("p.bookings", "bookings")
        .select(`SUM(bookings."finalPrice") as "finalPrice"`)
        .where(
          `bookings."dateStart" BETWEEN '${date
            .startOf("day")
            .toISO()}' AND '${date.endOf("day").toISO()}'`
        )
        .getQuery()
    );
    return await this.buildingRepository
      .createQueryBuilder("b")
      .leftJoinAndSelect("b.client", "c")
      .leftJoinAndSelect("b.parkingList", "p")
      .leftJoinAndSelect("p.bookings", "bookings")
      .select(`SUM(bookings."finalPrice") as "finalPrice"`)
      .where(
        `bookings."dateStart" BETWEEN '${date
          .startOf("day")
          .toISO()}' AND '${date.endOf("day").toISO()}'`
      )
      .getRawOne();
  }
  async findAllProfitOfAllBuildingsMonthly(
    dateStart: string,
    dateEnd: string
  ): Promise<MonthlyFinalPrice[] | undefined> {
    return await this.buildingRepository.query(
      `
      SELECT
      DATE_TRUNC('day', gs."date"::timestamptz) as "day",
      SUM(subquery."finalPrice") as "dailyIncome",
      subquery.count as "bookingsCount"
    FROM (
      SELECT generate_series(
              '${dateStart}'::timestamptz,
              '${dateEnd}'::timestamptz,
              '1 day'::interval
            )::date as "date"
    ) gs
    LEFT JOIN (
      SELECT
        DATE_TRUNC('day', bookings."dateStart"::timestamptz) as "day",
        SUM(bookings."finalPrice") as "finalPrice",
        COUNT(bookings.id) as count
      FROM "building" "b"
      LEFT JOIN "client" "c" ON "c"."id" = "b"."clientId"
      LEFT JOIN "parking" "p" ON "p"."buildingId" = "b"."id"
      LEFT JOIN "booking" "bookings" ON "bookings"."parkingId" = "p"."id"
      WHERE bookings."dateStart" BETWEEN '${dateStart}' AND '${dateEnd}'
      AND bookings."bookingState" = 3
      AND bookings."userId" != 'a4393ecc-f0ba-4bca-ace7-4d5b9b744f18'::uuid
      AND bookings."userId" != '5d6c26ad-1594-4be4-b7f7-0729d0d1ab3d'::uuid
      GROUP BY "day"
    ) subquery ON gs."date" = subquery."day"
    GROUP BY gs."date", "bookingsCount"
    ORDER BY gs."date";
    `
    );
  }
  async findDailyIncomeOfAllBuildingsInAMonth(days?: number) {
    const profit: MonthlyBuildingProfit = {
      monthlyBuildingProfit: [],
    };
    const dateStart = DateTime.now()
      .minus({ days: days ? days : 30 })
      .startOf("day")
      .toISO()!;
    const dateEnd = DateTime.now().endOf("day").toISO()!;
    const results = await this.findAllProfitOfAllBuildingsMonthly(
      dateStart,
      dateEnd
    );
    profit.monthlyBuildingProfit = profit.monthlyBuildingProfit.concat(
      results ? results : []
    );
    return profit;
  }
  getAllNearbyAndReservableBuildings(
    user: UserEntity,
    point: PointInput,
    distance: number,
    parkingType?: ParkingType
  ): Observable<BuildingOutput[]> {
    const query = `
      select * from
      get_nearby_and_available_buildings('${user.id}', ${
      point.coordinates[0]
    }, ${point.coordinates[1]}, ${distance} , ${parkingType ? parkingType : -1})
      `;
    return from(this.buildingRepository.query(query));
  }
  getAllNearbyAndBuildings(
    point: PointInput,
    distance: number
  ): Observable<BuildingOutput[]> {
    const query = `
      select * from
      get_nearby_buildings_with_coords_as_text(${point.coordinates[0]}, ${point.coordinates[1]}, ${distance} )
      `;
    return from(this.buildingRepository.query(query));
  }
}
