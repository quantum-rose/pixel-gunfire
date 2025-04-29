import { Node, Prefab, SpriteFrame, Vec2 } from 'cc';
import Singleton from '../Base/Singleton';
import { IClientInput, IMsgRoom, IPlayer, IRoom, IVec2, State, StateEventEnum } from '../Common';
import { ActorManager } from '../Entity/Actor/ActorManager';
import { BulletManager } from '../Entity/Bullet/BulletManager';
import { EventEnum } from '../Enum';
import { JoyStickManager } from '../UI/JoyStickManager';
import { RankItemManager } from '../UI/RankItemManager';
import EventManager from './EventManager';

export default class DataManager extends Singleton {
    static get Instance() {
        return super.GetInstance<DataManager>();
    }

    public jm: JoyStickManager;

    public stage: Node;

    public prefabMap = new Map<string, Prefab>();

    public textureMap = new Map<string, SpriteFrame[]>();

    public actorMap = new Map<number, ActorManager>();

    public rankMap = new Map<number, RankItemManager>();

    public bulletMap = new Map<number, BulletManager>();

    public lastState = new State();

    public state = new State();

    public playerInfo: IPlayer = null;

    public roomInfo: IRoom = null;

    public frameId = 1;

    constructor() {
        super();

        this.state.on(StateEventEnum.ExplosionBorn, this._onExplosionBorn, this);
        this.state.on(StateEventEnum.DamageBorn, this._onDamageBorn, this);
    }

    public isMe(id: number) {
        return this.playerInfo && this.playerInfo.id === id;
    }

    public syncRoom(data: IMsgRoom) {
        this.roomInfo = data.room;
        this.state.load(data.state);
        this.lastState.load(data.state);
    }

    public applyInput(input: IClientInput) {
        this.state.applyInput(input);
    }

    private _onExplosionBorn(bulletId: number, position: IVec2) {
        EventManager.Instance.emit(EventEnum.ExplosionBorn, bulletId, position);
    }

    private _onDamageBorn(actorId: number, bulletOwner: number, damage: number, crit: boolean) {
        EventManager.Instance.emit(EventEnum.DamageBorn, actorId, bulletOwner, damage, crit);
    }

    private _shootInterval = 0;

    public autoPlay(dt: number) {
        const myActor = this.state.actors.get(this.playerInfo.id);
        if (myActor.hp <= 0) {
            this.jm.input = new Vec2(0, 0);
            return;
        }

        if (myActor.hp < 100) {
            const otherAliveActors = Array.from(this.state.actors.values()).filter(actor => actor.id !== myActor.id && actor.hp > 0);
            if (otherAliveActors.length === 0) {
                this.jm.input = new Vec2(0, 0);
                return;
            }

            otherAliveActors.sort((a, b) => a.hp - b.hp);
            const targetActor = otherAliveActors[0];
            this.jm.input = new Vec2(targetActor.position.x - myActor.position.x, targetActor.position.y - myActor.position.y).normalize();
        } else {
            const otherActors = Array.from(this.state.actors.values()).filter(actor => actor.id !== myActor.id);
            if (otherActors.length === 0) {
                this.jm.input = new Vec2(0, 0);
                return;
            }

            this.jm.input = new Vec2(myActor.position.x, myActor.position.y).rotate(((Math.sin(Date.now() * 0.0005) * Math.E + 1) * Math.PI) / 2).normalize();
        }

        this._shootInterval -= dt;
        if (this._shootInterval <= 0) {
            this._shootInterval = 0.2;
            EventManager.Instance.emit(EventEnum.WeaponShoot);
        }
    }
}

window['DataManager'] = DataManager.Instance;
