import { Column, Entity, JoinTable, ManyToMany } from "typeorm";
import { Field, ObjectType } from "@nestjs/graphql";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";
import { ParkingEntity } from "../../parking/entity/parking.entity";

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
  @ManyToMany(() => ParkingEntity, (p) => p.tags)
  @JoinTable(
    {
      name: 'tags_parkings',
      joinColumn: {
        name: "parkingId",
        referencedColumnName: "id"
      },
      inverseJoinColumn: {
        name: "tagsId",
        referencedColumnName: "id"
      }
    }
  )
  @Field(() => [ParkingEntity])
  parkings: ParkingEntity[]
}