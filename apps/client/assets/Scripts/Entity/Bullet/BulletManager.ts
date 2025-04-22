import { _decorator, instantiate } from 'cc';
import { EntityManager } from '../../Base/EntityManager';
import { EntityTypeEnum, IBullet, IVec2 } from '../../Common';
import { EntityStateEnum, EventEnum } from '../../Enum';
import DataManager from '../../Global/DataManager';
import EventManager from '../../Global/EventManager';
import { radianToAngle } from '../../Utils';
import { ExplosionManager } from '../Explosion/ExplosionManager';
import { BulletStateMachine } from './BulletStateMachine';
const { ccclass, property } = _decorator;

@ccclass('BulletManager')
export class BulletManager extends EntityManager {
    public id: number;

    public init(data: IBullet) {
        this.id = data.id;

        this.fsm = this.addComponent(BulletStateMachine);
        this.fsm.init(data.type);

        this.state = EntityStateEnum.Idle;

        EventManager.Instance.on(EventEnum.ExplosionBorn, this._onExplosionBorn, this);
    }

    protected onDestroy(): void {
        EventManager.Instance.off(EventEnum.ExplosionBorn, this._onExplosionBorn, this);
    }

    private _onExplosionBorn(id: number, position: IVec2) {
        if (this.id !== id) {
            return;
        }

        const explosionPrefab = DataManager.Instance.prefabMap.get(EntityTypeEnum.Explosion);
        const explosionNode = instantiate(explosionPrefab);
        explosionNode.setParent(DataManager.Instance.stage);
        const em = explosionNode.addComponent(ExplosionManager);
        em.init(EntityTypeEnum.Explosion, position);

        DataManager.Instance.bulletMap.delete(this.id);
        this.node.destroy();
    }

    public render(data: IBullet) {
        const { position, direction } = data;
        this.node.setPosition(position.x, position.y);

        const rotation = radianToAngle(Math.atan2(direction.y, direction.x));
        this.node.setRotationFromEuler(0, 0, rotation);
    }
}
