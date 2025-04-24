import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
import { ApiMsgEnum, IPlayer } from '../Common';
import { NetworkManager } from '../Global/NetworkManager';
import { PlayerManager } from '../UI/PlayerManager';
const { ccclass, property } = _decorator;

@ccclass('HallManager')
export class HallManager extends Component {
    @property(Node)
    public playerContainer: Node;

    @property(Prefab)
    public playerPrefab: Prefab;

    protected onLoad(): void {
        this.playerContainer.destroyAllChildren();
    }

    protected start(): void {
        NetworkManager.Instance.listen(ApiMsgEnum.MsgPlayerList, this._onPlayerListSync, this);

        this._getPlayerList();
    }

    private async _getPlayerList(): Promise<void> {
        if (!NetworkManager.Instance.isConnected) {
            await NetworkManager.Instance.connect();
        }

        const { success, res, error } = await NetworkManager.Instance.callApi(ApiMsgEnum.ApiPlayerList, {});

        if (success) {
            this._renderPlayerList(res.list);
        } else {
            console.error('Error fetching player list:', error);
        }
    }

    private _onPlayerListSync(data: { list: IPlayer[] }) {
        this._renderPlayerList(data.list);
    }

    private _renderPlayerList(list: IPlayer[]) {
        for (const child of this.playerContainer.children) {
            child.active = false;
        }

        while (this.playerContainer.children.length < list.length) {
            const playerNode = instantiate(this.playerPrefab);
            playerNode.active = false;
            playerNode.setParent(this.playerContainer);
        }

        for (let i = 0; i < list.length; i++) {
            this.playerContainer.children[i].getComponent(PlayerManager).init(list[i]);
        }
    }
}
