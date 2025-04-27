import { Node, Prefab, SpriteFrame } from 'cc';
import Singleton from '../Base/Singleton';
import { IClientInput, IMsgRoom, IPlayer, IRoom, IVec2, State, StateEventEnum } from '../Common';
import { ActorManager } from '../Entity/Actor/ActorManager';
import { BulletManager } from '../Entity/Bullet/BulletManager';
import { EventEnum } from '../Enum';
import { JoyStickManager } from '../UI/JoyStickManager';
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

    private _onDamageBorn(actorId: number, damage: number, crit: boolean) {
        EventManager.Instance.emit(EventEnum.DamageBorn, actorId, damage, crit);
    }
}

window['DataManager'] = DataManager.Instance;
