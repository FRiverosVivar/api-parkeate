import { Column, Entity} from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";
import { BaseEntityWithIdAbstract } from "../../utils/interfaces/base-entity-with-id.abstract";

@Entity('request')
@ObjectType()
export class RequestEntity extends BaseEntityWithIdAbstract {
  @Column()
  @Field(() => String)
  subject: string
  @Column()
  @Field(() => String)
  email: string
  @Column()
  @Field(() => String)
  phoneNumber: string
  @Column()
  @Field(() => String)
  content: string
}
