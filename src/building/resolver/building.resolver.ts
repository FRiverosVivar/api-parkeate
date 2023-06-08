import { Resolver } from "@nestjs/graphql";
import { BuildingEntity } from "../entity/building.entity";

@Resolver(BuildingEntity)
export class BuildingResolver {

}