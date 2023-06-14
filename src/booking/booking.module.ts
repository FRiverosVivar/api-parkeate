import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BookingEntity } from "./entity/booking.entity";
import { registerEnumType } from "@nestjs/graphql";
import { BookingTypesEnum } from "./enum/booking-types.enum";
import { BookingStatesEnum } from "./enum/booking-states.enum";
registerEnumType(BookingTypesEnum,{
  name: 'BookingTypes'
})
registerEnumType(BookingStatesEnum,{
  name: 'BookingStates'
})
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([BookingEntity])],
  providers: [],
  exports: [],
})
export class BookingModule {}