import { _decorator, Color, instantiate, Label, Node, ProgressBar, Sprite } from 'cc';
import { EntityManager } from '../../Base/EntityManager';
import { IActor, InputTypeEnum } from '../../Common';
import { EntityStateEnum, EventEnum } from '../../Enum';
import DataManager from '../../Global/DataManager';
import EventManager from '../../Global/EventManager';
import { radianToAngle } from '../../Utils';
import { WeaponManager } from '../Weapon/WeaponManager';
import { ActorStateMachine } from './ActorStateMachine';
const { ccclass, property } = _decorator;

@ccclass('ActorManager')
export class ActorManager extends EntityManager {
    public id: number;

    private _wm: WeaponManager;

    private _hp: Node;

    private _nickname: Node;

    public init(data: IActor) {
        this.id = data.id;
        this._hp = this.node.getChildByName('HP');
        if (DataManager.Instance.isMe(this.id)) {
            this._hp.getComponentInChildren(Sprite).color = new Color(0, 220, 0, 255);
        } else {
            this._hp.getComponentInChildren(Sprite).color = new Color(255, 0, 0, 255);
        }
        this._nickname = this.node.getChildByName('Nickname');
        this._nickname.getComponent(Label).string = data.nickname;

        this.fsm = this.addComponent(ActorStateMachine);
        this.fsm.init(data.type);

        this.state = EntityStateEnum.Idle;

        const weaponPrefab = DataManager.Instance.prefabMap.get(data.weaponType);
        const weaponNode = instantiate(weaponPrefab);
        weaponNode.setParent(this.node);
        weaponNode.setPosition(0, 38);
        this._wm = weaponNode.addComponent(WeaponManager);
        this._wm.init(data);
    }

    public render(data: IActor) {
        const { position, direction } = data;
        this.node.setPosition(position.x, position.y);

        let flipX = direction.x < 0;
        this.node.setScale(flipX ? -1 : 1, 1);

        const rotation = radianToAngle(Math.atan2(direction.y, flipX ? -direction.x : direction.x));
        this._wm.node.setRotationFromEuler(0, 0, rotation);

        this._hp.setScale(flipX ? -1 : 1, 1);
        this._hp.getComponent(ProgressBar).progress = data.hp / 100;

        this._nickname.setScale(flipX ? -1 : 1, 1);
    }

    public tick(dt: number): void {
        if (!DataManager.Instance.isMe(this.id)) {
            return;
        }

        if (DataManager.Instance.jm.input.length() > 0) {
            const { x, y } = DataManager.Instance.jm.input;
            EventManager.Instance.emit(EventEnum.ClientSync, {
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
