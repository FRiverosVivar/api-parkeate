import { Controller, Get, OnModuleInit, Query } from "@nestjs/common";
import { BookingService } from "./booking/service/booking.service";
import { BookingEntity } from "./booking/entity/booking.entity";
import { Observable } from "rxjs";
import { UpdateBookingInput } from "./booking/model/update-booking.input";
import { BookingStatesEnum } from "./booking/enum/booking-states.enum";
import { ParkingService } from "./parking/service/parking.service";
import { BuildingService } from "./building/service/building.service";
import { CreateBuildingInput } from "./building/model/create-building.input";
import { TagsService } from "./tags/service/tags.service";
import { CreateTagInput } from "./tags/model/create-tag.input";
import { CreateParkingInput } from "./parking/model/create-parking.input";
import { ParkingType } from "./parking/model/parking-type.enum";

@Controller('/booking/confirmPayment')
export class AppController implements OnModuleInit {
  constructor(
    private readonly bookingService: BookingService,
    private buildingService: BuildingService,
    private parkingService: ParkingService,
    private tagsService: TagsService
  ) {}

  @Get('')
  updateBookingToReservedStatus(@Query('bookingId') bookingId: string): Observable<BookingEntity> {
    const updateBookingInput: UpdateBookingInput = {
      id: bookingId,
      bookingState: BookingStatesEnum.RESERVED,
    }
    return this.bookingService.updateBooking(updateBookingInput);
  }

  async onModuleInit(): Promise<void> {
    const b = await this.buildingService.findBuildingsByClientId("c24239ab-54a2-4eeb-b36e-df45b37662a4").toPromise()
    if(b && b.length === 0){
      this.createBuildingsAndParkings('c24239ab-54a2-4eeb-b36e-df45b37662a4')
    }
  }
  async createBuildingsAndParkings(clientId: string) {
    const createBuilding: CreateBuildingInput = {
      address: "Av. San Martín 924, Temuco, Araucanía",
      floors: "-2,-1",
      location: {
        type: "Point",
        coordinates: [-72.590016, -38.7428564]
      },
      name: "Edificio Vanguardia",
      phoneNumber: "+56984480502",
      photo: "",
      description: `
      Un excelente emplazamiento para disfrutar con comodidad y tranquilidad la vida urbana. Un lugar estratégico para actividades comerciales y una inmejorable oportunidad de inversión.
      Vanguardia Center es un proyecto vanguardista.
      `
    }
    const createBuilding2: CreateBuildingInput = {
      address: "Pasaje Oriente 1331, Villa Alemana",
      floors: "3, -2,-1",
      location: {
        type: "Point",
        coordinates: [ -71.381373, -33.059492]
      },
      name: "Edificio Huanhuali",
      phoneNumber: "+56931968013",
      photo: "",
      description: `
      Un excelente emplazamiento para disfrutar con comodidad y tranquilidad la vida urbana. Un lugar estratégico para actividades comerciales y una inmejorable oportunidad de inversión.
      Huanhuali Center es un proyecto vanguardista.
      `
    }
    // const tag = await this.createVanguardiaTags();
    const building = await this.buildingService.createBuilding(createBuilding, 'c24239ab-54a2-4eeb-b36e-df45b37662a4', ['7409b1a9-350c-42ef-82dd-0a9f1ede61de']).toPromise()
    const building2 = await this.buildingService.createBuilding(createBuilding2, 'c24239ab-54a2-4eeb-b36e-df45b37662a4',  ['7409b1a9-350c-42ef-82dd-0a9f1ede61de']).toPromise()
    if(building) {
      this.createVanguardiaParkings(building.id);
    }
    if(building2) {
      this.createVanguardiaParkings(building2.id);
    }
  }
  async createVanguardiaParkings(buildingId: string) {
    const createParkingInput: CreateParkingInput = {
      active: false,
      address: "Av. San Martín 924, Temuco, Araucanía",
      blocked: false,
      code: "1",
      floor: -1,
      name: "Estacionamiento 1",
      photo: "",
      priceMonthly: "90000",
      pricePerMinute: "15",
      priceYearly: "600000",
      reserved: false,
      section: "A",
      tax: "0.1",
      type: ParkingType.PER_MINUTE
    }
    const p = await this.parkingService.createParking(createParkingInput, buildingId, 'c24239ab-54a2-4eeb-b36e-df45b37662a4').toPromise()
    const createParkingInput2: CreateParkingInput = {
      active: false,
      address: "Av. San Martín 924, Temuco, Araucanía",
      blocked: false,
      code: "2",
      floor: -1,
      name: "Estacionamiento 2",
      photo: "",
      priceMonthly: "90000",
      pricePerMinute: "20",
      priceYearly: "600000",
      reserved: false,
      section: "A",
      tax: "0.08",
      type: ParkingType.PER_MINUTE
    }
    const p2 = await this.parkingService.createParking(createParkingInput2, buildingId, 'c24239ab-54a2-4eeb-b36e-df45b37662a4').toPromise()
    const createParkingInput3: CreateParkingInput = {
      active: false,
      address: "Av. San Martín 924, Temuco, Araucanía",
      blocked: false,
      code: "3",
      floor: -1,
      name: "Estacionamiento 3",
      photo: "",
      priceMonthly: "90000",
      pricePerMinute: "25",
      priceYearly: "600000",
      reserved: false,
      section: "A",
      tax: "0.08",
      type: ParkingType.PER_MINUTE
    }
    const p3 = await this.parkingService.createParking(createParkingInput3, buildingId, 'c24239ab-54a2-4eeb-b36e-df45b37662a4').toPromise()

  }
  async createVanguardiaTags() {
    const createTag: CreateTagInput = {
      color: "",
      icon: `<i class="ri-wheelchair-fill"></i>`,
      name: "Acceso Silla de Ruedas"
    }
    const tag = await this.tagsService.createTag(createTag).toPromise()
    return tag
  }
}
