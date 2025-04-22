import { _decorator, instantiate } from 'cc';
import { EntityManager } from '../../Base/EntityManager';
import { IActor, InputTypeEnum } from '../../Common';
import { EntityStateEnum } from '../../Enum';
import DataManager from '../../Global/DataManager';
import { radianToAngle } from '../../Utils';
import { WeaponManager } from '../Weapon/WeaponManager';
import { ActorStateMachine } from './ActorStateMachine';
const { ccclass, property } = _decorator;

@ccclass('ActorManager')
export class ActorManager extends EntityManager {
    public id: number;

    private _wm: WeaponManager;

    public init(data: IActor) {
        this.id = data.id;

        this.fsm = this.addComponent(ActorStateMachine);
        this.fsm.init(data.type);

        this.state = EntityStateEnum.Idle;

        const weponPrefab = DataManager.Instance.prefabMap.get(data.weaponType);
        const weponNode = instantiate(weponPrefab);
        weponNode.setParent(this.node);
        weponNode.setPosition(0, 38);
        this._wm = weponNode.addComponent(WeaponManager);
        this._wm.init(data);
    }

    public render(data: IActor) {
        const { position, direction } = data;
        this.node.setPosition(position.x, position.y);

        let flipX = direction.x < 0;
        this.node.setScale(flipX ? -1 : 1, 1);

        const rotation = radianToAngle(Math.atan2(direction.y, flipX ? -direction.x : direction.x));
        this._wm.node.setRotationFromEuler(0, 0, rotation);
    }

    public tick(dt: number): void {
        if (DataManager.Instance.jm.input.length() > 0) {
            const { x, y } = DataManager.Instance.jm.input;
            DataManager.Instance.applyInput({
                type: InputTypeEnum.ActorMove,
                id: this.id,
                direction: { x, y },
                dt,
            });

            this.state = EntityStateEnum.Run;
        } else {
            this.state = EntityStateEnum.Idle;
        }
    }
}
