import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { RequestEntity } from "../entity/request.entity";
import { RequestService } from "./request.service";
import { Public } from "../../auth/decorator/public.decorator";
import { CreateRequestInput } from "../model/create-request.input";

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
}
