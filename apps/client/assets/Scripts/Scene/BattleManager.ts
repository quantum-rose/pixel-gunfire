import { _decorator, Component, instantiate, Node, Prefab, SpriteFrame } from 'cc';
import { ApiMsgEnum, EntityTypeEnum, IInput, IMsgServerSync, InputTypeEnum } from '../Common';
import { ActorManager } from '../Entity/Actor/ActorManager';
import { BulletManager } from '../Entity/Bullet/BulletManager';
import { EventEnum, PrefabPathEnum, TexturePathEnum } from '../Enum';
import DataManager from '../Global/DataManager';
import EventManager from '../Global/EventManager';
import { NetworkManager } from '../Global/NetworkManager';
import { ObjectPoolManager } from '../Global/ObjectPoolManager';
import { ResourceManager } from '../Global/ResourceManager';
import { JoyStickManager } from '../UI/JoyStickManager';
const { ccclass, property } = _decorator;

@ccclass('BattleManager')
export class BattleManager extends Component {
    private _stage: Node;

    private _ui: Node;

    private _shouldUpdate: boolean = false;

    protected onLoad(): void {
        this._stage.destroyAllChildren();
    }

    protected async start(): Promise<void> {
        this._clearGame();
        await Promise.all([this._loadResources(), this._connectServer()]);
        this._initGame();
    }

    private _initGame() {
        NetworkManager.Instance.listen(ApiMsgEnum.MsgServerSync, this._onServerSync, this);
        EventManager.Instance.on(EventEnum.ClientSync, this._onClientSync, this);
        DataManager.Instance.jm = this._ui.getComponentInChildren(JoyStickManager);
        this._initMap();
        this._shouldUpdate = true;
    }

    private _clearGame() {
        NetworkManager.Instance.unlisten(ApiMsgEnum.MsgServerSync, this._onServerSync, this);
        EventManager.Instance.off(EventEnum.ClientSync, this._onClientSync, this);
        DataManager.Instance.stage = this._stage = this.node.getChildByName('Stage');
        this._ui = this.node.getChildByName('UI');
    }

    private async _loadResources() {
        const list: Promise<void>[] = [];

        for (const type in PrefabPathEnum) {
            const p = ResourceManager.Instance.loadRes(PrefabPathEnum[type], Prefab).then(prefab => {
                DataManager.Instance.prefabMap.set(type, prefab);
            });
            list.push(p);
        }

        for (const type in TexturePathEnum) {
            const p = ResourceManager.Instance.loadDir(TexturePathEnum[type], SpriteFrame).then(spriteFrames => {
                DataManager.Instance.textureMap.set(type, spriteFrames);
            });
            list.push(p);
        }

        await Promise.all(list);
    }

    private async _connectServer() {
        try {
            await NetworkManager.Instance.connect();
        } catch (_error) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this._connectServer();
        }
    }

    private _onServerSync(data: IMsgServerSync) {
        for (const input of data.inputs) {
            DataManager.Instance.applyInput(input);
        }
    }

    private _onClientSync(input: IInput) {
        const data = {
            input,
            frameId: DataManager.Instance.frameId++,
        };
        NetworkManager.Instance.send(ApiMsgEnum.MsgClientSync, data);
    }

    protected update(dt: number): void {
        if (!this._shouldUpdate) {
            return;
        }

        this._render();
        this._tick(dt);
    }

    private _tick(dt: number) {
        this._tickActors(dt);

        DataManager.Instance.applyInput({
            type: InputTypeEnum.TimePast,
            dt,
        });
    }

    private _render() {
        this._renderActors();
        this._renderBullets();
        this._renderStage();
    }

    private _initMap() {
        const prefab = DataManager.Instance.prefabMap.get(EntityTypeEnum.Map);
        const node = instantiate(prefab);
        node.setParent(this._stage);
    }

    private _tickActors(dt: number) {
        for (const actor of DataManager.Instance.state.actors) {
            const am = DataManager.Instance.actorMap.get(actor.id);
            am.tick(dt);
        }
    }

    private _renderActors() {
        for (const actor of DataManager.Instance.state.actors) {
            let am = DataManager.Instance.actorMap.get(actor.id);
            if (!am) {
                const prefab = DataManager.Instance.prefabMap.get(actor.type);
                const node = instantiate(prefab);
                node.setParent(this._stage);
                am = node.addComponent(ActorManager);
                DataManager.Instance.actorMap.set(actor.id, am);
                am.init(actor);
            }
            am.render(actor);
        }
    }

    private _renderBullets() {
        for (const bullet of DataManager.Instance.state.bullets) {
            let bm = DataManager.Instance.bulletMap.get(bullet.id);
            if (!bm) {
                const node = ObjectPoolManager.Instance.get(bullet.type);
                bm = node.getComponent(BulletManager) ?? node.addComponent(BulletManager);
                DataManager.Instance.bulletMap.set(bullet.id, bm);
                bm.init(bullet);
            }
            bm.render(bullet);
        }
    }

    private _renderStage() {
        const myPlayer = DataManager.Instance.state.actors.find(actor => actor.id === DataManager.Instance.myPlayerId);
        if (!myPlayer) {
            return;
        }
        this._stage.setPosition(-myPlayer.position.x, -myPlayer.position.y);
    }
}
