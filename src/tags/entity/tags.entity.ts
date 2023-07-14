import { Column, Entity, JoinTable, ManyToMany } from "typeorm";
import { Field, ObjectType } from "@nestjs/graphql";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";
import { ParkingEntity } from "../../parking/entity/parking.entity";
import { BuildingEntity } from "../../building/entity/building.entity";

@Entity('tags')
@ObjectType()
export class TagsEntity extends BaseEntityWithIdAbstract {
  @Column()
  @Field(() => String)
  name: string
  @Column()
  @Field( () => String)
  color: string
  @Column()
  @Field(() => String)
  icon: string
  @ManyToMany(() => BuildingEntity, (b) => b.tags)
  @JoinTable(
    {
      name: 'tags_and_buildings',
      joinColumn: {
        name: "tagsId",
        referencedColumnName: "id"
      },
      inverseJoinColumn: {
        name: "buildingId",
        referencedColumnName: "id"
      }
    }
  )
  @Field(() => [BuildingEntity])
  buildings: BuildingEntity[]
}
