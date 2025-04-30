import { _decorator, Component, director, instantiate, Label, Node, Prefab, Vec3 } from 'cc';
import { ApiMsgEnum, IClientInput, IMsgClientSync, IMsgRoom, IMsgServerSync, InputTypeEnum } from '../Common';
import { ActorManager } from '../Entity/Actor/ActorManager';
import { BulletManager } from '../Entity/Bullet/BulletManager';
import { EventEnum, SceneEnum } from '../Enum';
import { DataManager, EventManager, NetworkManager, ObjectPoolManager, PrefabManager, ResourceLoader } from '../Global';
import { JoyStickManager } from '../UI/JoyStickManager';
import { RankItemManager } from '../UI/RankItemManager';
const { ccclass, property } = _decorator;

@ccclass('BattleManager')
export class BattleManager extends Component {
    @property(Node)
    public stage: Node;

    @property(Node)
    public actorLayer: Node;

    @property(Node)
    public joyStick: Node;

    @property(Node)
    public rank: Node;

    @property(Prefab)
    public rankItemPrefab: Prefab;

    @property(Node)
    public countDown: Node;

    private _pendingMsg: IMsgClientSync[] = [];

    private _shouldUpdate: boolean = false;

    protected onLoad(): void {
        this._pendingMsg = [];
        this._shouldUpdate = false;

        DataManager.Instance.stage = this.stage;
        DataManager.Instance.jm = this.joyStick.getComponent(JoyStickManager);

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
        DataManager.Instance.rankMap.clear();
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
        return new Promise<void>(resolve => {
            ResourceLoader.init(
                (progress: number) => {
                    console.log(`资源加载进度: ${progress * 100}%`);
                },
                () => {
                    console.log('资源加载完成');
                    resolve();
                }
            );
        });
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

        if (input.type === InputTypeEnum.ActorMove) {
            DataManager.Instance.applyInput(input);
            this._pendingMsg.push(data);
        }
    }

    protected update(dt: number): void {
        if (!this._shouldUpdate) {
            return;
        }

        this._render();
        this._tick(dt);
    }

    private _tick(dt: number) {
        // DataManager.Instance.autoPlay(dt);

        this._tickActors(dt);
    }

    private _render() {
        this._renderActors();
        this._renderBullets();
        this._renderStage();
        this._renderRank();
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
                const prefab = PrefabManager.getPrefab(actor.type);
                const node = instantiate(prefab);
                node.setParent(this.actorLayer);
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
        const myActor = DataManager.Instance.state.actors.get(DataManager.Instance.playerInfo.id);
        if (!myActor) {
            return;
        }

        if (myActor.hp <= 0) {
            this.countDown.active = true;
            this.countDown.getComponentInChildren(Label).string = `${Math.ceil(myActor.rebirthTime)}`;
            this.stage.setScale(Vec3.lerp(new Vec3(), this.stage.getScale(), new Vec3(0.333333, 0.333333, 1), 0.1));
            this.stage.setPosition(Vec3.lerp(new Vec3(), this.stage.getPosition(), new Vec3(0, 0), 0.07));
        } else {
            this.countDown.active = false;
            this.stage.setScale(Vec3.lerp(new Vec3(), this.stage.getScale(), new Vec3(1, 1, 1), 0.1));

            const targetPosition = new Vec3(-myActor.position.x, -myActor.position.y);

            if (DataManager.Instance.jm.input) {
                // 虚拟摇杆有输入
                const input = DataManager.Instance.jm.input;
                const leadFactor = 160; // 视野前方的偏移量
                targetPosition.x -= input.x * leadFactor;
                targetPosition.y -= input.y * leadFactor;
            }

            // 缓动镜头位置
            this.stage.setPosition(Vec3.lerp(new Vec3(), this.stage.getPosition(), targetPosition, 0.07));
        }
    }

    private _renderRank() {
        const actors = Array.from(DataManager.Instance.state.actors.values()).sort((a, b) => b.damage - a.damage);

        for (let i = 0; i < actors.length; i++) {
            const actor = actors[i];
            let rm = DataManager.Instance.rankMap.get(actor.id);
            if (!rm) {
                const rankItemNode = instantiate(this.rankItemPrefab);
                rankItemNode.setParent(this.rank);
                rm = rankItemNode.getComponent(RankItemManager);
                DataManager.Instance.rankMap.set(actor.id, rm);
                rm.init(actor.id, i);
            }
            rm.render(actor, i);
        }

        for (const rm of DataManager.Instance.rankMap.values()) {
            if (!DataManager.Instance.state.actors.has(rm.id)) {
                rm.node.destroy();
                DataManager.Instance.rankMap.delete(rm.id);
            }
        }
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
