import { Node, instantiate } from 'cc';
import Singleton from '../Base/Singleton';
import { EntityTypeEnum } from '../Common';
import { DataManager } from './DataManager';
import { PrefabManager } from './PrefabManager';

export class ObjectPoolManager extends Singleton {
    static get Instance() {
        return super.GetInstance<ObjectPoolManager>();
    }

    private _objectPool: Node;

    private _pool = new Map<EntityTypeEnum, Node[]>();

    public get(type: EntityTypeEnum): Node {
        if (!this._objectPool) {
            this._objectPool = DataManager.Instance.stage.getChildByName('ObjectPool');
        }

        if (!this._pool.has(type)) {
            this._pool.set(type, []);
            const container = new Node(type + 'Pool');
            container.setParent(this._objectPool);
        }

        const pool = this._pool.get(type);
        if (pool.length === 0) {
            const prefab = PrefabManager.getPrefab(type);
            const node = instantiate(prefab);
            node.name = type;
            node.setParent(this._objectPool.getChildByName(type + 'Pool'));
            node.active = true;
            return node;
        }

        const node = pool.pop();
        node.active = true;
        return node;
    }

    public ret(node: Node) {
        node.active = false;
        this._pool.get(node.name as EntityTypeEnum).push(node);
    }

    public clear() {
        this._objectPool = null;
        this._pool.clear();
    }
}
