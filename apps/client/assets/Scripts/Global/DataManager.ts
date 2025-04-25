import { Node, Prefab, SpriteFrame } from 'cc';
import Singleton from '../Base/Singleton';
import { IClientInput, IPlayer, IRoom, IState, IVec2, State, StateEventEnum } from '../Common';
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

    public state = new State();

    public playerInfo: IPlayer = null;

    public roomInfo: IRoom = null;

    public frameId = 1;

    constructor() {
        super();

        this.state.on(StateEventEnum.ExplosionBorn, this._onExplosionBorn, this);
    }

    public isMe(id: number) {
        return this.playerInfo && this.playerInfo.id === id;
    }

    public loadState(state: IState) {
        this.state.load(state);
    }

    public applyInput(input: IClientInput) {
        this.state.applyInput(input);
    }

    private _onExplosionBorn(bulletId: number, position: IVec2) {
        EventManager.Instance.emit(EventEnum.ExplosionBorn, bulletId, position);
    }
}

window['DataManager'] = DataManager.Instance;
