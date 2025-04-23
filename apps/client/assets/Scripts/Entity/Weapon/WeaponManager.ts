import { _decorator, Node, UITransform } from 'cc';
import { EntityManager } from '../../Base/EntityManager';
import { IActor, InputTypeEnum } from '../../Common';
import { EntityStateEnum, EventEnum } from '../../Enum';
import DataManager from '../../Global/DataManager';
import EventManager from '../../Global/EventManager';
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
        if (this._owner !== DataManager.Instance.myPlayerId) {
            return;
        }

        const pointWorldPos = this._point.getWorldPosition();
        const pointStagePos = DataManager.Instance.stage.getComponent(UITransform).convertToNodeSpaceAR(pointWorldPos);
        const anchorWorldPos = this._anchor.getWorldPosition();
        const direction = pointWorldPos.subtract(anchorWorldPos).normalize();
        EventManager.Instance.emit(EventEnum.ClientSync, {
            type: InputTypeEnum.WeaponShoot,
            owner: this._owner,
            position: { x: pointStagePos.x, y: pointStagePos.y },
            direction: { x: direction.x, y: direction.y },
        });

        this.state = EntityStateEnum.Attack;
    }
}
