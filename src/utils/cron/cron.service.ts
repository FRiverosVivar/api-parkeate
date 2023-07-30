import { forwardRef, Global, Inject, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { DateTime, Settings } from "luxon";
import { BookingStatesEnum } from "../../booking/enum/booking-states.enum";
import { Repository } from "typeorm";
import { CronEntity } from "./entity/cron.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { from, map, Observable, switchMap } from "rxjs";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../exceptions/UUIDBadFormat.exception";

@Injectable()
export class CronService{
  constructor(
    @InjectRepository(CronEntity)
    private cronRepository: Repository<CronEntity>,
) {
  }
  loadAllCronJobsFromCronRepository() {
    return this.cronRepository.find({
      where: {
        executed: false
      }
    })
  }
  findCronByBookingIdAndExecuteFalse(bookingId: string): Observable<CronEntity | null> {
    if (!uuid.validate(bookingId)) {
      throw new UUIDBadFormatException();
    }
    return this.getCronByBookingIdAndExecuteFalse(bookingId).pipe(map((c) => {
      return c;
    }))
  }
  getCronByBookingIdAndExecuteFalse(bookingId: string): Observable<CronEntity | null> {
    return from(this.cronRepository.findOne({
      where: {
        executed: false,
        bookingId: bookingId,
      }
    }))
  }
  createCron(dateStart: DateTime, dateEnd: DateTime, stateWhenEnd: BookingStatesEnum, bookingId: string): Promise<CronEntity> {
    const input = {
      dateStart: dateStart.toJSDate(),
      dateEnd: dateEnd.toJSDate(),
      bookingId,
      stateWhenEnd,
      executed: false,
    }
    return this.cronRepository.save(this.cronRepository.create(input))
  }
  deleteCronByBookingId(bookingId: string) {
    return this.cronRepository.delete(
      {
        bookingId: bookingId
      }
    )
  }
  saveCron(cron: CronEntity) {
    return this.cronRepository.save(cron)
  }
}
