import { Injectable, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { ScheduleEntity } from "../entity/schedule.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { from, map, Observable, switchMap } from "rxjs";
import { CreateScheduleInput } from "../model/create-schedule.input";
import { UpdateScheduleInput } from "../model/update-schedule.input";
import { MaxSchedulesException } from "../../utils/exceptions/max-schedules.exception";
import { DuplicatedScheduleException } from "../../utils/exceptions/duplicated-schedule.exception";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../../utils/exceptions/UUIDBadFormat.exception";
import { ParkingService } from "../../parking/service/parking.service";

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(ScheduleEntity)
    private readonly scheduleRepository: Repository<ScheduleEntity>,
    private readonly parkingService: ParkingService
  ) {
  }
  createSchedule(createScheduleInput: CreateScheduleInput, parkingId: string): Observable<ScheduleEntity> {
    const newSchedule = this.scheduleRepository.create(createScheduleInput);
    const createSchedule = this.findSchedulesByParkingId(parkingId).pipe(
      switchMap((schedules) => {
        if(!schedules || schedules.length === 0)
          return this.scheduleRepository.save(newSchedule)

        if(schedules.length >= 6)
          throw new MaxSchedulesException()

        if(this.checkDuplicatedScheduleDay(schedules, newSchedule))
          throw new DuplicatedScheduleException()

        return this.scheduleRepository.save(newSchedule);
      })
    )
    return this.parkingService.findParkingById(parkingId).pipe(switchMap(() => createSchedule))
  }
  removeSchedule(scheduleId: string): Observable<ScheduleEntity> {
    if (uuid.validate(scheduleId)) {
      throw new UUIDBadFormatException();
    }
    return this.findScheduleById(scheduleId).pipe(
      switchMap((b) => {
        return from(this.scheduleRepository.remove([b])).pipe(map((b) => b[0]));
      })
    )
  }
  updateSchedule(updateScheduleInput: UpdateScheduleInput): Observable<ScheduleEntity> {
    return from(
      this.scheduleRepository.preload({
        ...updateScheduleInput,
      }),
    ).pipe(
      switchMap((schedule) => {
        if (!schedule) {
          throw new NotFoundException();
        }
        return from(this.scheduleRepository.save(schedule));
      }),
    );
  }
  findSchedulesByParkingId(parkingId: string): Observable<ScheduleEntity[]> {
    return this.getSchedulesByParkingId(parkingId).pipe(
      map((schedule) => {
        if(!schedule)
          throw new NotFoundException()

        return schedule;
      })
    )
  }
  getSchedulesByParkingId(parkingId: string): Observable<ScheduleEntity[] | null> {
    return from(
      this.scheduleRepository.find({
        where: {
          parking: {
            id: parkingId
          }
        },
      }),
    )
  }
  findScheduleById(scheduleId: string): Observable<ScheduleEntity> {
    return this.getScheduleById(scheduleId).pipe(
      map((schedule) => {
        if(!schedule)
          throw new NotFoundException()

        return schedule;
      })
    )
  }
  getScheduleById(scheduleId: string): Observable<ScheduleEntity | null> {
    return from(
      this.scheduleRepository.findOne({
        where: {
          id: scheduleId,
        },
      }),
    )
  }
  private checkDuplicatedScheduleDay(schedules: ScheduleEntity[], newSchedule: ScheduleEntity): boolean {
    return schedules.some((s) => {
      if(s.day === newSchedule.day) {
        return true
      }
    })
  }
}