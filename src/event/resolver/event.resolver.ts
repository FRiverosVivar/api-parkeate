import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { EventService } from "../service/event.service";
import { EventEntity } from "../entity/event.entity";
import { UserType } from "src/auth/decorator/user-type.decorator";
import { UseGuards } from "@nestjs/common";
import { UserTypesEnum } from "src/user/constants/constants";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UserTypeGuard } from "src/auth/guards/user-type.guard";
import { CreateEventInput } from "../model/create-event.input";
import { UpdateEventInput } from "../model/update-event.input";
import {
  EventsPaginated,
  PageOptionsDto,
} from "src/utils/interfaces/pagination.type";
import { CreatePhotoInput } from "src/photo/model/create-photo.input";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";
import { Observable } from "rxjs";

@Resolver()
export class EventResolver {
  constructor(private readonly eventService: EventService) {}
  @Mutation(() => EventEntity)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  createEvent(
    @Args("createEventInput")
    createEventInput: CreateEventInput
  ) {
    return this.eventService.createEvent(createEventInput);
  }
  @Mutation(() => EventEntity)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  updateEvent(
    @Args("updateEventInput")
    updateEventInput: UpdateEventInput
  ) {
    return this.eventService.updateEvent(updateEventInput);
  }
  @Query(() => EventEntity)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  findEventById(@Args("eventId") eventId: string) {
    return this.eventService.findEventById(eventId);
  }
  @Query(() => EventEntity)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  findEventByCode(@Args("code") code: string) {
    return this.eventService.findEventByCode(code);
  }
  @Mutation(() => EventEntity)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  removeEvent(@Args("eventId") eventId: string) {
    return this.eventService.removeEvent(eventId);
  }
  @Query(() => EventsPaginated)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  getPaginatedEvents(
    @Args("paginationOptions") paginationOptions: PageOptionsDto
  ) {
    return this.eventService.findPaginatedEvents(paginationOptions);
  }
  @Mutation(() => EventEntity)
  setEventPhoto(
    @Args("eventId") eventId: string,
    @Args("createPhotoInput") createPhotoInput: CreatePhotoInput,
    @Args("file", { type: () => GraphQLUpload }) file: FileUpload
  ): Observable<EventEntity> {
    return this.eventService.setEventPhoto(eventId, createPhotoInput, file);
  }
}
