import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { LiquidationEntity } from "../entity/liquidation.entity";
import { LiquidationService } from "../service/liquidation.service";
import { Observable, from } from "rxjs";
import { UserType } from "../../auth/decorator/user-type.decorator";
import { UserTypesEnum } from "../../user/constants/constants";
import { UseGuards } from "@nestjs/common";
import { UserTypeGuard } from "../../auth/guards/user-type.guard";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "src/auth/decorator/current-user.decorator";
import { ClientEntity } from "src/client/entity/client.entity";
import {
  LiquidationsPaginated,
  PageOptionsDto,
} from "src/utils/interfaces/pagination.type";
import { UpdateLiquidationInput } from "../model/update-liquidation.input";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";

@Resolver(LiquidationEntity)
export class LiquidationResolver {
  constructor(private liquidationService: LiquidationService) {}
  @Query(() => [LiquidationEntity])
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  forceToLiquidateToAllBookings(): Observable<LiquidationEntity[]> {
    return from(this.liquidationService.generateLiquidations());
  }
  @Query(() => LiquidationsPaginated)
  @UseGuards(JwtAuthGuard)
  getAllLiquidations(
    @Args("paginationOptions") paginationOptions: PageOptionsDto,
    @CurrentUser() user: ClientEntity
  ): Observable<LiquidationsPaginated> {
    return from(
      this.liquidationService.findAllLiquidations(paginationOptions, user)
    );
  }
  @Query(() => LiquidationEntity)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  updateLiquidation(
    @Args("updateLiquidationInput")
    updateLiquidationInput: UpdateLiquidationInput
  ): Observable<LiquidationEntity> {
    return this.liquidationService.updateLiquidation(updateLiquidationInput);
  }
  @Mutation(() => LiquidationEntity)
  @UserType(UserTypesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  uploadPaymentReceipt(
    @Args("liquidationId") liquidationId: string,
    @Args("receiptPdf", { type: () => GraphQLUpload }) receiptPdf: FileUpload,
    @CurrentUser() client: ClientEntity
  ): Observable<LiquidationEntity> {
    return from(
      this.liquidationService.uploadReceiptPdfToS3(
        liquidationId,
        receiptPdf,
        client
      )
    );
  }
}
