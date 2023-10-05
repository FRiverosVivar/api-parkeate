import { EntitySubscriberInterface, EventSubscriber, InsertEvent } from "typeorm"
import { LiquidationEntity } from "../entity/liquidation.entity"
import { DateTime } from "luxon"

@EventSubscriber()
export class LiquidationSubscriber implements EntitySubscriberInterface<LiquidationEntity> {
    /**
     * Indicates that this subscriber only listen to Post events.
     */
    listenTo() {
        return LiquidationEntity
    }
    
    /**
     * Called before post insertion.
     */
    async beforeInsert(event: InsertEvent<LiquidationEntity>) {
        const date = DateTime.now().toFormat('ddMMyy')
        const liquidationRepository = event.connection.getRepository(LiquidationEntity)
        const lastLiqs = await liquidationRepository.find({
            select: ['numberId'],
            order: { numberId: 'DESC' },
            take: 1
        })
        const lastLiq = lastLiqs.pop()
        const lastNum = lastLiq ? lastLiq.numberId.slice(0,lastLiq.numberId.length-6) + 1: 1
        event.entity.numberId = `${lastNum}${date}`
    }
}