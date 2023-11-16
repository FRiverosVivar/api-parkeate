import { forwardRef, Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BookingEntity } from "./entity/booking.entity";
import { registerEnumType } from "@nestjs/graphql";
import { BookingTypesEnum } from "./enum/booking-types.enum";
import { BookingStatesEnum } from "./enum/booking-states.enum";
import { BookingService } from "./service/booking.service";
import { BookingResolver } from "./resolver/booking.resolver";
import { EmailService } from "../utils/email/email.service";
import { SmsService } from "../utils/sms/sms.service";
import { SchedulerRegistry } from "@nestjs/schedule";
import { HttpModule } from "@nestjs/axios";
import { CryptService } from "src/utils/crypt/crypt.service";

registerEnumType(BookingTypesEnum, {
  name: "BookingTypes",
});
registerEnumType(BookingStatesEnum, {
  name: "BookingStates",
});
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([BookingEntity]), HttpModule],
  providers: [
    BookingService,
    BookingResolver,
    EmailService,
    SmsService,
    SchedulerRegistry,
    CryptService,
  ],
  exports: [BookingService, BookingResolver],
})
export class BookingModule {}
