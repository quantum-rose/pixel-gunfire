import { _decorator, Animation, Color, instantiate, Label, Node, Prefab, ProgressBar, Sprite, Tween, tween, Vec3 } from 'cc';
import { EntityManager } from '../../Base/EntityManager';
import { IActor, InputTypeEnum, IVec2, toFixed } from '../../Common';
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

    @property(Prefab)
    public infoPrefab: Prefab;

    @property(Prefab)
    public damagePrefab: Prefab;

    private _infoLayer: Node;

    private _info: Node;

    private _hp: Node;

    private _nickname: Node;

    private _wm: WeaponManager;

    private _lastPos: IVec2;

    private _tw: Tween<Node>;

    public init(data: IActor) {
        this.id = data.id;

        this.fsm = this.addComponent(ActorStateMachine);
        this.fsm.init(data.type);

        this.state = EntityStateEnum.Idle;

        this._infoLayer = DataManager.Instance.stage.getChildByName('InfoLayer');

        this._info = instantiate(this.infoPrefab);
        this._info.setParent(this._infoLayer);

        this._hp = this._info.getChildByName('HP');
        if (DataManager.Instance.isMe(this.id)) {
            this._hp.getComponentInChildren(Sprite).color = new Color(0, 220, 0, 255);
        } else {
            this._hp.getComponentInChildren(Sprite).color = new Color(255, 0, 0, 255);
        }

        this._nickname = this._info.getChildByName('Nickname');
        this._nickname.getComponent(Label).string = data.nickname;

        const weaponPrefab = DataManager.Instance.prefabMap.get(data.weaponType);
        const weaponNode = instantiate(weaponPrefab);
        weaponNode.setParent(this.node);
        weaponNode.setPosition(0, 38);
        this._wm = weaponNode.addComponent(WeaponManager);
        this._wm.init(data);

        this._lastPos = null;
        this._tw?.stop();
        this._tw = null;

        EventManager.Instance.on(EventEnum.DamageBorn, this._onDamageBorn, this);
    }

    protected onDestroy(): void {
        this._tw?.stop();
        this._tw = null;
        this._info.destroy();
        this._info = null;
        this._hp = null;
        this._nickname = null;

        EventManager.Instance.off(EventEnum.DamageBorn, this._onDamageBorn, this);
    }

    public render(data: IActor) {
        const { position, direction } = data;

        if (!this._lastPos) {
            this._lastPos = { x: position.x, y: position.y };
            this.node.setPosition(this._lastPos.x, this._lastPos.y);
        } else if (this._lastPos.x !== position.x || this._lastPos.y !== position.y) {
            this.node.setPosition(this._lastPos.x, this._lastPos.y);
            this._lastPos = { x: position.x, y: position.y };

            this.state = EntityStateEnum.Run;
            this._tw?.stop();
            this._tw = tween(this.node)
                .to(0.1, { position: new Vec3(position.x, position.y) })
                .call(() => {
                    this.state = EntityStateEnum.Idle;
                })
                .start();
        }

        let flipX = direction.x < 0;
        this.node.setScale(flipX ? -1 : 1, 1);

        const rotation = radianToAngle(Math.atan2(direction.y, flipX ? -direction.x : direction.x));
        this._wm.node.setRotationFromEuler(0, 0, rotation);

        this._info.setPosition(this.node.position.x, this.node.position.y);
        this._hp.getComponent(ProgressBar).progress = data.hp / 100;
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
                direction: { x: toFixed(x), y: toFixed(y) },
                dt: toFixed(dt),
            });
        }
    }

    private _onDamageBorn(actorId: number, damage: number, crit: boolean) {
        if (this.id !== actorId) {
            return;
        }

        const node = instantiate(this.damagePrefab);
        node.setParent(this._infoLayer);
        node.setPosition(this.node.position.x + 40 * (Math.random() - 0.5), this.node.position.y);
        const label = node.getComponentInChildren(Label);
        label.string = crit ? `暴击 ${damage}` : `${damage}`;
        label.color = crit ? new Color(255, 0, 0, 255) : new Color(255, 128, 128, 255);

        node.getComponentInChildren(Animation).on(Animation.EventType.FINISHED, () => {
            node.destroy();
        });
    }
}
