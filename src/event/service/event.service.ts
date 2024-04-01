import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventEntity } from "../entity/event.entity";
import { Equal, Repository } from "typeorm";
import { CreateEventInput } from "../model/create-event.input";
import { Observable, from, map, switchMap, tap } from "rxjs";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../../utils/exceptions/UUIDBadFormat.exception";
import { EVENT_CODE_LENGTH } from "../constants/events.constants";
import { generateRandomString } from "src/utils/utils";
import { BuildingService } from "src/building/service/building.service";
import { ParkingService } from "src/parking/service/parking.service";
import { UpdateEventInput } from "../model/update-event.input";
import e from "express";
import {
  PageDto,
  PageOptionsDto,
  PaginationMeta,
} from "src/utils/interfaces/pagination.type";
import { CreatePhotoInput } from "src/photo/model/create-photo.input";
import { FileUpload } from "graphql-upload-minimal";
import { PhotoService } from "src/photo/service/photo.service";

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
    private readonly buildingService: BuildingService,
    private readonly parkingService: ParkingService,
    private readonly photoService: PhotoService
  ) {}
  createEvent(createEventInput: CreateEventInput) {
    const event = this.eventRepository.create(createEventInput);
    event.active = false;
    event.code = generateRandomString(EVENT_CODE_LENGTH);
    return this.eventRepository.save(event);
  }
  findEventByCode(code: string) {
    return this.getEventByCode(code).pipe(
      map((e) => {
        if (!e) throw new NotFoundException();
        return e;
      })
    );
  }
  findEventById(id: string) {
    if (!uuid.validate(id)) {
      throw new UUIDBadFormatException();
    }

    return this.getEventById(id).pipe(
      map((e) => {
        if (!e) throw new NotFoundException();
        return e;
      })
    );
  }
  async updateEvent(updateEventInput: UpdateEventInput) {
    const event = await this.eventRepository.preload(updateEventInput);
    return this.eventRepository.save(event!);
  }
  async removeEvent(eventId: string) {
    const event = await this.findEventById(eventId).toPromise();
    return this.eventRepository.remove(event!);
  }
  async findPaginatedEvents(pagination: PageOptionsDto) {
    const query = this.eventRepository
      .createQueryBuilder("e")
      .orderBy("e.createdAt", "DESC")
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
  private getEventByCode(code: string): Observable<EventEntity | null> {
    return from(
      this.eventRepository.findOneBy({
        code: Equal(code),
      })
    );
  }
  private getEventById(id: string): Observable<EventEntity | null> {
    return from(
      this.eventRepository.findOneBy({
        id: Equal(id),
      })
    );
  }
  setEventPhoto(
    eventId: string,
    createPhotoInput: CreatePhotoInput,
    file: FileUpload | undefined
  ): Observable<EventEntity> {
    if (!file) throw new BadRequestException();

    return this.findEventById(eventId).pipe(
      switchMap((e) => {
        return this.photoService.createPhoto(createPhotoInput, file).pipe(
          tap((photo) => {
            if (e.bannerImage) this.photoService.removePhoto(e.bannerImage);
          }),
          switchMap((photo) => {
            e.bannerImage = photo.url;
            return this.eventRepository.save(e);
          })
        );
      })
    );
  }
}
