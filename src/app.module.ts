import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule, registerEnumType } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { AuthModule } from './auth/auth.module';
import { FileModule } from './file/file.module';
import FileConfig, { config } from './file/middleware/file.config';
import { EmailService } from './utils/email/email.service';
import { HoldingModule } from "./holding/holding.module";
import { PhotoModule } from "./photo/photo.module";
import { ParkingModule } from "./parking/parking.module";
import { ScheduleModule } from "./schedule/schedule.module";
import { BuildingEntity } from "./building/entity/building.entity";
import { BuildingModule } from "./building/building.module";
import { VehicleModule } from "./vehicle/vehicle.module";
import { TagsModule } from "./tags/tags.module";
import { BookingModule } from "./booking/booking.module";
import { PlacesService } from "./utils/places/places.service";
import { PlacesModule } from "./utils/places/places.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [FileConfig],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: './schema.gql',
      debug: false,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
    TypeOrmModule.forRoot({
      keepConnectionAlive: true,
      type: 'postgres',
      host: process.env.PG_HOST,
      port: parseInt(<string>process.env.PG_PORT),
      username: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DB,
      autoLoadEntities: true,
      synchronize: true,
    }),
    FileModule.forRoot(config()),
    PhotoModule,
    ParkingModule,
    ScheduleModule,
    BuildingModule,
    TagsModule,
    AuthModule,
    VehicleModule,
    HoldingModule,
    BookingModule,
    PlacesModule,
  ],
  controllers: [AppController],
  providers: [AppService, EmailService, PlacesService],
})
export class AppModule {}
