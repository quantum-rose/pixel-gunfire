import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
import { ApiMsgEnum } from '../Common';
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
        this.playerContainer.removeAllChildren();

        NetworkManager.Instance.connect();

        this._getPlayerList();
    }

    private async _getPlayerList(): Promise<void> {
        if (!NetworkManager.Instance.isConnected) {
            await NetworkManager.Instance.connect();
        }

        const { success, res, error } = await NetworkManager.Instance.callApi(ApiMsgEnum.ApiPlayerList, {});

        if (success) {
            this.playerContainer.removeAllChildren();

            for (const player of res.list) {
                const playerNode = instantiate(this.playerPrefab);
                playerNode.getComponent(PlayerManager).init(player);
                this.playerContainer.addChild(playerNode);
            }
        } else {
            console.error('Error fetching player list:', error);
        }
    }
}
