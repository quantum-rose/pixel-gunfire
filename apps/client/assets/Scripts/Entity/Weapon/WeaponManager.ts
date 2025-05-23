import { _decorator, Node, UITransform } from 'cc';
import { EntityManager } from '../../Base/EntityManager';
import { IActor, InputTypeEnum, toFixed } from '../../Common';
import { EntityStateEnum, EventEnum } from '../../Enum';
import { DataManager, EventManager } from '../../Global';
import { WeaponStateMachine } from './WeaponStateMachine';
const { ccclass, property } = _decorator;

@ccclass('WeaponManager')
export class WeaponManager extends EntityManager {
    private _body: Node;

    private _anchor: Node;

    private _point: Node;

    private _owner: number;

    public init(data: IActor) {
        this._body = this.node.getChildByName('Body');
        this._anchor = this._body.getChildByName('Anchor');
        this._point = this._anchor.getChildByName('Point');
        this._owner = data.id;

        this.fsm = this._body.addComponent(WeaponStateMachine);
        this.fsm.init(data.weaponType);

        this.state = EntityStateEnum.Idle;

        EventManager.Instance.on(EventEnum.WeaponShoot, this._onWeaponShoot, this);
    }

    protected onDestroy(): void {
        EventManager.Instance.off(EventEnum.WeaponShoot, this._onWeaponShoot, this);
    }

    private _onWeaponShoot() {
        if (!DataManager.Instance.isMe(this._owner)) {
            return;
        }

        const myActor = DataManager.Instance.state.actors.get(this._owner);
        if (myActor.hp <= 0) {
            return;
        }

        const pointWorldPos = this._point.getWorldPosition();
        const pointStagePos = DataManager.Instance.stage.getComponent(UITransform).convertToNodeSpaceAR(pointWorldPos);
        const anchorWorldPos = this._anchor.getWorldPosition();
        const direction = pointWorldPos.subtract(anchorWorldPos).normalize();
        EventManager.Instance.emit(EventEnum.ClientSync, {
            type: InputTypeEnum.WeaponShoot,
            owner: this._owner,
            position: { x: toFixed(pointStagePos.x), y: toFixed(pointStagePos.y) },
            direction: { x: toFixed(direction.x), y: toFixed(direction.y) },
        });

        this.state = EntityStateEnum.Attack;
    }
}
