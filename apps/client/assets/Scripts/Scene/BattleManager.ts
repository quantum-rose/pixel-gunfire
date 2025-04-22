import { _decorator, Component, instantiate, Node, Prefab, SpriteFrame } from 'cc';
import { EntityTypeEnum, InputTypeEnum } from '../Common';
import { ActorManager } from '../Entity/Actor/ActorManager';
import { BulletManager } from '../Entity/Bullet/BulletManager';
import { PrefabPathEnum, TexturePathEnum } from '../Enum';
import DataManager from '../Global/DataManager';
import { ResourceManager } from '../Global/ResourceManager';
import { JoyStickManager } from '../UI/JoyStickManager';
const { ccclass, property } = _decorator;

@ccclass('BattleManager')
export class BattleManager extends Component {
    private _stage: Node;

    private _ui: Node;

    private _shouldUpdate: boolean = false;

    protected onLoad(): void {
        this._stage = this.node.getChildByName('Stage');
        this._ui = this.node.getChildByName('UI');

        this._stage.destroyAllChildren();

        DataManager.Instance.jm = this._ui.getComponentInChildren(JoyStickManager);
        DataManager.Instance.stage = this._stage;

        this._loadResources();
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

        this._initMap();

        this._shouldUpdate = true;
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
                const prefab = DataManager.Instance.prefabMap.get(bullet.type);
                const node = instantiate(prefab);
                node.setParent(this._stage);
                bm = node.addComponent(BulletManager);
                DataManager.Instance.bulletMap.set(bullet.id, bm);
                bm.init(bullet);
            }
            bm.render(bullet);
        }
    }

    private _renderStage() {
        const actor = DataManager.Instance.state.actors[0];
        this._stage.setPosition(-actor.position.x, -actor.position.y);
    }
}
