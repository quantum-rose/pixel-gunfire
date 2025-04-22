import { _decorator } from 'cc';
import { EntityManager } from '../../Base/EntityManager';
import { EntityTypeEnum, IVec2 } from '../../Common';
import { EntityStateEnum } from '../../Enum';
import { ExplosionStateMachine } from './ExplosionStateMachine';
const { ccclass, property } = _decorator;

@ccclass('ExplosionManager')
export class ExplosionManager extends EntityManager {
    public init(type: EntityTypeEnum, position: IVec2) {
        this.fsm = this.addComponent(ExplosionStateMachine);
        this.fsm.init(type);

        this.node.setPosition(position.x, position.y);

        this.state = EntityStateEnum.Idle;
    }
}
