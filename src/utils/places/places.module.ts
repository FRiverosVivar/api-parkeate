import { Global, Module } from "@nestjs/common";
import { PlacesService } from "./places.service";
import { PlacesController } from "./places.controller";

@Global()
@Module({
  providers: [PlacesService],
  exports: [PlacesService],
  controllers: [PlacesController]
})
export class PlacesModule {}
