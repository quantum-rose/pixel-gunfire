import { _decorator, Component, director, instantiate, Node, Prefab, SpriteFrame, Vec3 } from 'cc';
import { ApiMsgEnum, IClientInput, IMsgClientSync, IMsgRoom, IMsgServerSync } from '../Common';
import { ActorManager } from '../Entity/Actor/ActorManager';
import { BulletManager } from '../Entity/Bullet/BulletManager';
import { EventEnum, PrefabPathEnum, SceneEnum, TexturePathEnum } from '../Enum';
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

    private _actorLayer: Node;

    private _ui: Node;

    private _pendingMsg: IMsgClientSync[] = [];

    private _shouldUpdate: boolean = false;

    protected onLoad(): void {
        this._stage = this.node.getChildByName('Stage');
        this._actorLayer = this._stage.getChildByName('ActorLayer');
        this._ui = this.node.getChildByName('UI');
        this._pendingMsg = [];
        this._shouldUpdate = false;

        DataManager.Instance.stage = this._stage;
        DataManager.Instance.jm = this._ui.getComponentInChildren(JoyStickManager);

        NetworkManager.Instance.listen(ApiMsgEnum.MsgRoom, this._onRoomSync, this);
        NetworkManager.Instance.listen(ApiMsgEnum.MsgServerSync, this._onServerSync, this);
        EventManager.Instance.on(EventEnum.ClientSync, this._onClientSync, this);
    }

    protected onDestroy(): void {
        ObjectPoolManager.Instance.clear();

        DataManager.Instance.stage = null;
        DataManager.Instance.jm = null;
        DataManager.Instance.state.reset();
        DataManager.Instance.lastState.reset();
        DataManager.Instance.actorMap.clear();
        DataManager.Instance.bulletMap.clear();
        DataManager.Instance.frameId = 1;

        NetworkManager.Instance.unlisten(ApiMsgEnum.MsgRoom, this._onRoomSync, this);
        NetworkManager.Instance.unlisten(ApiMsgEnum.MsgServerSync, this._onServerSync, this);
        EventManager.Instance.off(EventEnum.ClientSync, this._onClientSync, this);
    }

    protected async start(): Promise<void> {
        await Promise.all([this._loadResources(), this._connectServer()]);

        this._shouldUpdate = true;
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

    private _onRoomSync(data: IMsgRoom) {
        DataManager.Instance.syncRoom(data);
    }

    private _onServerSync(data: IMsgServerSync) {
        DataManager.Instance.state.load(DataManager.Instance.lastState.dump());

        for (const input of data.inputs) {
            DataManager.Instance.applyInput(input);
        }

        DataManager.Instance.lastState.load(DataManager.Instance.state.dump());

        this._pendingMsg = this._pendingMsg.reduce((acc, msg) => {
            if (msg.frameId > data.lastFrameId) {
                DataManager.Instance.applyInput(msg.input);
                acc.push(msg);
            }
            return acc;
        }, []);
    }

    private _onClientSync(input: IClientInput) {
        const data: IMsgClientSync = {
            input,
            frameId: DataManager.Instance.frameId++,
        };
        NetworkManager.Instance.send(ApiMsgEnum.MsgClientSync, data);

        DataManager.Instance.applyInput(input);
        this._pendingMsg.push(data);
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
    }

    private _render() {
        this._renderActors();
        this._renderBullets();
        this._renderStage();
    }

    private _tickActors(dt: number) {
        for (const actor of DataManager.Instance.state.actors.values()) {
            const am = DataManager.Instance.actorMap.get(actor.id);
            am.tick(dt);
        }
    }

    private _renderActors() {
        for (const actor of DataManager.Instance.state.actors.values()) {
            let am = DataManager.Instance.actorMap.get(actor.id);
            if (!am) {
                const prefab = DataManager.Instance.prefabMap.get(actor.type);
                const node = instantiate(prefab);
                node.setParent(this._actorLayer);
                am = node.getComponent(ActorManager);
                DataManager.Instance.actorMap.set(actor.id, am);
                am.init(actor);
            }
            am.render(actor);
        }

        for (const am of DataManager.Instance.actorMap.values()) {
            if (!DataManager.Instance.state.actors.has(am.id)) {
                am.node.destroy();
                DataManager.Instance.actorMap.delete(am.id);
            }
        }
    }

    private _renderBullets() {
        for (const bullet of DataManager.Instance.state.bullets.values()) {
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
        const myPlayer = DataManager.Instance.state.actors.get(DataManager.Instance.playerInfo.id);
        if (!myPlayer) {
            return;
        }

        const targetPosition = new Vec3(-myPlayer.position.x, -myPlayer.position.y);

        if (DataManager.Instance.jm.input) {
            // 虚拟摇杆有输入
            const input = DataManager.Instance.jm.input;
            const leadFactor = 160; // 视野前方的偏移量
            targetPosition.x -= input.x * leadFactor;
            targetPosition.y -= input.y * leadFactor;
        }

        // 缓动镜头位置
        this._stage.setPosition(Vec3.lerp(new Vec3(), this._stage.getPosition(), targetPosition, 0.1));
    }

    public async handleClickLeave() {
        const { success, error } = await NetworkManager.Instance.callApi(ApiMsgEnum.ApiRoomLeave, {});

        if (success) {
            DataManager.Instance.roomInfo = null;

            director.loadScene(SceneEnum.Hall);
        } else {
            console.error('Error joining room:', error);
        }
    }
}
