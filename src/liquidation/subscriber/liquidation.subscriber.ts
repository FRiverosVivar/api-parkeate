import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from "typeorm";
import { LiquidationEntity } from "../entity/liquidation.entity";
import { DateTime } from "luxon";

@EventSubscriber()
export class LiquidationSubscriber
  implements EntitySubscriberInterface<LiquidationEntity>
{
  listenTo() {
    return LiquidationEntity;
  }

  async beforeInsert(event: InsertEvent<LiquidationEntity>) {
    const date = DateTime.now().toFormat("ddMMyy");
    const liquidationRepository =
      event.connection.getRepository(LiquidationEntity);
    const lastLiqs = await liquidationRepository.find({
      select: ["numberId"],
      order: { numberId: "DESC" },
      take: 1,
    });
    const lastLiq = lastLiqs.pop();
    const lastNum = lastLiq
      ? parseInt(lastLiq.numberId.slice(0, lastLiq.numberId.length - 6)) + 1
      : 1;
    event.entity.numberId = `${lastNum}${date}`;
  }
}
