import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { RequestEntity } from "../entity/request.entity";
import { RequestService } from "../service/request.service";
import { Public } from "../../auth/decorator/public.decorator";
import { CreateRequestInput } from "../model/create-request.input";
import { EventsPaginated, PageOptionsDto, RequestsPaginated } from "../../utils/interfaces/pagination.type";
import { UserType } from "../../auth/decorator/user-type.decorator";
import { UserTypesEnum } from "../../user/constants/constants";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UserTypeGuard } from "../../auth/guards/user-type.guard";
import { UpdateRequestInput } from "../model/update-request.input";

@Resolver(() => RequestEntity)
export class RequestResolver {
  constructor(private requestService: RequestService) {
  }
  @Mutation(() => RequestEntity, { name: 'createRequest' })
  @Public()
  createRequest(
    @Args('createRequestInput') createRequestInput: CreateRequestInput,
  ) {
    return this.requestService.createRequest(createRequestInput);
  }
  @Query(() => RequestsPaginated)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  getPaginatedRequests(
    @Args("paginationOptions") paginationOptions: PageOptionsDto
  ) {
    return this.requestService.findPaginatedRequests(paginationOptions);
  }
  @Query(() => RequestsPaginated)
  updateRequest(
    @Args("updateRequestInput") updateRequestInput: UpdateRequestInput
  ) {
    return this.requestService.updateRequest(updateRequestInput);
  }
}
