import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { In, Repository } from "typeorm";
import { TagsEntity } from "../entity/tags.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { from, map, Observable, switchMap } from "rxjs";
import { CreateTagInput } from "../model/create-tag.input";
import { UpdateTagInput } from "../model/update-tag.input";
import * as uuid from "uuid";
import { UUIDBadFormatException } from "../../utils/exceptions/UUIDBadFormat.exception";

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(TagsEntity)
    private readonly tagsRepository: Repository<TagsEntity>
  ) {}
  createTag(createTagInput: CreateTagInput): Observable<TagsEntity> {
    const tag = this.tagsRepository.create(createTagInput);
    return this.getTagByName(tag.name).pipe(
      switchMap((t) => {
        if (t)
          throw new BadRequestException(
            "This tag with this name already exists"
          );

        return from(this.tagsRepository.save(tag));
      })
    );
  }
  removeTag(tagId: string): Observable<TagsEntity> {
    if (!uuid.validate(tagId)) {
      throw new UUIDBadFormatException();
    }
    return from(this.findTagById(tagId)).pipe(
      switchMap((tag) => {
        return from(this.tagsRepository.remove([tag])).pipe(map((t) => t[0]));
      })
    );
  }
  updateTag(updateTagInput: UpdateTagInput): Observable<TagsEntity> {
    return from(
      this.tagsRepository.preload({
        ...updateTagInput,
      })
    ).pipe(
      switchMap((tags) => {
        if (!tags) {
          throw new NotFoundException();
        }
        return from(this.tagsRepository.save(tags));
      })
    );
  }
  findTagByName(name: string): Observable<TagsEntity> {
    if (name === "") {
      throw new UUIDBadFormatException();
    }
    return this.getTagByName(name).pipe(
      map((t) => {
        if (!t) throw new NotFoundException();
        return t;
      })
    );
  }
  findTagById(tagId: string): Observable<TagsEntity> {
    if (!uuid.validate(tagId)) {
      throw new UUIDBadFormatException();
    }
    return this.getTagById(tagId).pipe(
      map((t) => {
        if (!t) throw new NotFoundException();
        return t;
      })
    );
  }
  findTagsByBuildingId(buildingId: string): Observable<TagsEntity[]> {
    if (!uuid.validate(buildingId)) {
      throw new UUIDBadFormatException();
    }
    return this.getTagsByBuildingId(buildingId).pipe(
      map((t) => {
        if (!t) throw new NotFoundException();
        return t;
      })
    );
  }
  findAllTagsByIds(tagsIds: string[]): Observable<TagsEntity[]> {
    tagsIds.forEach((id) => {
      if (!uuid.validate(id)) {
        throw new UUIDBadFormatException();
      }
    });
    return this.getTagsByIds(tagsIds);
  }
  private getTagsByBuildingId(buildingId: string): Observable<TagsEntity[]> {
    return from(
      this.tagsRepository.find({
        where: {
          buildings: {
            id: buildingId,
          },
        },
      })
    );
  }
  private getTagById(tagId: string): Observable<TagsEntity | null> {
    return from(
      this.tagsRepository.findOne({
        where: {
          id: tagId,
        },
      })
    );
  }
  private getTagByName(name: string): Observable<TagsEntity | null> {
    return from(
      this.tagsRepository.findOne({
        where: {
          name: name,
        },
      })
    );
  }
  private getTagsByIds(tagsIds: string[]): Observable<TagsEntity[]> {
    return from(
      this.tagsRepository.find({
        where: {
          id: In(tagsIds),
        },
      })
    );
  }
}
