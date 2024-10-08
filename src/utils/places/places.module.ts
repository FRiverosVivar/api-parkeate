import { Global, Module } from "@nestjs/common";
import { PlacesService } from "./places.service";
import { PlacesController } from "./places.controller";
import { HttpModule, HttpService } from "@nestjs/axios";

@Global()
@Module({
  imports: [HttpModule],
  providers: [PlacesService],
  exports: [PlacesService],
  controllers: [PlacesController],
})
export class PlacesModule {}
