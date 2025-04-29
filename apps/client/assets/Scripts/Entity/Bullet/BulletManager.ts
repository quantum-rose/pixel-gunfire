import { _decorator, Node, tween, Tween, Vec3 } from 'cc';
import { EntityManager } from '../../Base/EntityManager';
import { EntityTypeEnum, IBullet, IVec2 } from '../../Common';
import { EntityStateEnum, EventEnum } from '../../Enum';
import { DataManager, EventManager, ObjectPoolManager } from '../../Global';
import { radianToAngle } from '../../Utils';
import { ExplosionManager } from '../Explosion/ExplosionManager';
import { BulletStateMachine } from './BulletStateMachine';
const { ccclass, property } = _decorator;

@ccclass('BulletManager')
export class BulletManager extends EntityManager {
    public id: number;

    private _lastPos: IVec2;

    private _tw: Tween<Node>;

    public init(data: IBullet) {
        this.id = data.id;
        this._lastPos = null;
        this._tw?.stop();
        this._tw = null;
        this.node.active = false;

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

        const explosionNode = ObjectPoolManager.Instance.get(EntityTypeEnum.Explosion);
        const em = explosionNode.getComponent(ExplosionManager) ?? explosionNode.addComponent(ExplosionManager);
        em.init(EntityTypeEnum.Explosion, position);

        DataManager.Instance.bulletMap.delete(this.id);
        EventManager.Instance.off(EventEnum.ExplosionBorn, this._onExplosionBorn, this);
        ObjectPoolManager.Instance.ret(this.node);
    }

    public render(data: IBullet) {
        const { position, direction } = data;

        if (!this._lastPos) {
            this.node.active = true;
            this._lastPos = { x: position.x, y: position.y };
            this.node.setPosition(this._lastPos.x, this._lastPos.y);
        } else if (this._lastPos.x !== position.x || this._lastPos.y !== position.y) {
            this._tw?.stop();
            this.node.setPosition(this._lastPos.x, this._lastPos.y);
            this._lastPos = { x: position.x, y: position.y };

            this._tw = tween(this.node)
                .to(0.1, { position: new Vec3(position.x, position.y) })
                .start();
        }

        const rotation = radianToAngle(Math.atan2(direction.y, direction.x));
        this.node.setRotationFromEuler(0, 0, rotation);
    }
}
