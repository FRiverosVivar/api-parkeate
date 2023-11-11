import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CouponEntity } from "../entity/coupon.entity";
import { Equal, Repository } from "typeorm";
import { CreateCouponInput } from "../model/create-coupon.input";
import { UpdateCouponInput } from "../model/update-coupon.input";
import { GenerateCouponOptions } from "../model/generate-coupons-options.input";
import { UUIDBadFormatException } from "src/utils/exceptions/UUIDBadFormat.exception";
import * as uuid from "uuid";
import { NotFound } from "@aws-sdk/client-s3";
import { UserService } from "src/user/service/user.service";
import * as _ from "lodash";
import {
  PageDto,
  PageOptionsDto,
  PaginationMeta,
} from "src/utils/interfaces/pagination.type";
import { UserCouponEntity } from "../user-coupons/entity/user-coupons.entity";
import { DateTime } from "luxon";
import { UpdateUserCouponInput } from "../model/update-user-coupon.input";
import { UserEntity } from "src/user/entity/user.entity";
import { CurrentUser } from "src/auth/decorator/current-user.decorator";
@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(CouponEntity)
    private readonly couponRepository: Repository<CouponEntity>,
    @InjectRepository(UserCouponEntity)
    private readonly userCouponRepository: Repository<UserCouponEntity>,
    private readonly userService: UserService
  ) {}
  createCoupon(createCouponInput: CreateCouponInput) {
    const coupon = this.couponRepository.create(createCouponInput);
    coupon.assignedUsers = [];
    return this.couponRepository.save(coupon);
  }
  async updateCoupon(updateCouponInput: UpdateCouponInput) {
    const coupon = await this.couponRepository.preload(updateCouponInput);
    return this.couponRepository.save(coupon!);
  }
  async deleteCoupon(id: string) {
    if (!uuid.validate(id)) {
      throw new UUIDBadFormatException();
    }
    const coupon = await this.findCoupon(id);
    return this.couponRepository.remove(coupon);
  }
  findCoupon(id: string) {
    if (!uuid.validate(id)) {
      throw new UUIDBadFormatException();
    }
    return this.getCouponFromRepository(id);
  }
  findUserCoupon(id: string) {
    if (!uuid.validate(id)) {
      throw new UUIDBadFormatException();
    }
    return this.getUserCouponFromRepository(id);
  }
  private async getCouponFromRepository(id: string) {
    const coupon = await this.couponRepository.findOne({
      where: {
        id: id,
      },
    });
    if (!coupon) throw new NotFoundException();

    return coupon;
  }
  private async getUserCouponFromRepository(id: string) {
    const coupon = await this.userCouponRepository.findOne({
      relations: {
        coupon: true,
      },
      where: {
        id: id,
      },
    });
    if (!coupon) throw new NotFoundException();

    return coupon;
  }
  async findPaginatedCoupons(options: PageOptionsDto) {
    const coupons = await this.couponRepository.find({
      order: {
        createdAt: "DESC",
      },
    });
    const itemCount = coupons.length;
    const pageMetaDto = new PaginationMeta({
      pageOptionsDto: options,
      itemCount,
    });
    pageMetaDto.skip = (pageMetaDto.page - 1) * pageMetaDto.take;
    return new PageDto(coupons, pageMetaDto);
  }
  async assignCouponToUser(userId: string, couponId: string) {
    const coupon = await this.findCoupon(couponId);
    const user = (await this.userService.findUserById(userId).toPromise())!;
    const uc = user.userCoupons.find((uc) => uc.coupon.code === coupon.code);
    if (uc) {
      return uc;
    }
    const userCoupon = this.userCouponRepository.create({
      user,
      coupon,
      quantityRemaining: coupon.useTimes,
      valid: true,
    });
    const userCouponCreated = await this.userCouponRepository.save(userCoupon);
    coupon.assignedUsers.push(userCouponCreated);
    return this.couponRepository.save(coupon);
  }
  async generateCoupons(generateCouponsInput: GenerateCouponOptions) {
    const codes = this.generateBulkOfCouponsCode(
      generateCouponsInput.characters,
      generateCouponsInput.quantity,
      generateCouponsInput.prefix,
      generateCouponsInput.postfix,
      generateCouponsInput.length
    );
    const coupons: CouponEntity[] = [];
    for (let i = 0; i < codes.length; i++) {
      const coupon = await this.createCoupon({
        ...generateCouponsInput.couponInput,
        code: codes[i],
      });
      coupons.push(coupon);
    }
    return coupons;
  }
  private generateCouponCode(
    characters: string,
    prefix: string,
    postfix: string,
    long: number
  ): string {
    let code = prefix;

    for (let i = 0; i < long - (prefix.length + postfix.length); i++) {
      const randomCharacter =
        characters[Math.floor(Math.random() * characters.length)];
      code += randomCharacter;
    }

    code += postfix;
    return code;
  }

  private generateBulkOfCouponsCode(
    characters: string,
    quantity: number,
    prefix: string,
    postfix: string,
    long: number
  ): string[] {
    const coupons: string[] = [];

    for (let i = 0; i < quantity; i++) {
      const cupon = this.generateCouponCode(characters, prefix, postfix, long);
      coupons.push(cupon);
    }

    return coupons;
  }
  async removeAssignedUserFromCoupon(userCouponId: string) {
    const userCoupon = await this.findUserCoupon(userCouponId);
    return this.userCouponRepository.remove(userCoupon);
  }
  async updateUserCoupon(updateUserCouponInput: UpdateUserCouponInput) {
    const coupon = await this.userCouponRepository.preload(
      updateUserCouponInput
    );
    return this.userCouponRepository.save(coupon!);
  }
  async verifyIfCouponExistsAndThenAssignToUser(
    user: UserEntity,
    couponText: string
  ) {
    const coupon = await this.couponRepository.findOne({
      where: {
        code: Equal(couponText),
        active: true,
      },
    });
    if (!coupon) return null;
    return this.assignCouponToUser(user.id, coupon.id);
  }
  async getUserCoupons(user: UserEntity) {
    const uc = await this.userCouponRepository.find({
      relations: {
        user: true,
        coupon: true,
      },
      where: {
        user: {
          id: Equal(user.id),
        },
      },
    });
    return uc;
  }
}
