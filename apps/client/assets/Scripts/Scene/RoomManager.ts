import { ApiMsgEnum, IMsgRoom, IPlayer } from '@pixel-gunfire/common';
import { _decorator, Button, Component, instantiate, Label, Node, Prefab, UIOpacity } from 'cc';
import { DataManager, NetworkManager } from '../Global';
import { PlayerItemManager } from '../UI/PlayerItemManager';
const { ccclass, property } = _decorator;

@ccclass('RoomManager')
export class RoomManager extends Component {
    @property(Label)
    public roomNameLabel: Label;

    @property(Node)
    public startButton: Node;

    @property(Node)
    public playerContainer: Node;

    @property(Prefab)
    public playerPrefab: Prefab;

    protected start(): void {
        NetworkManager.Instance.listen(ApiMsgEnum.MsgRoom, this._onRoomSync, this);

        this._render();
    }

    protected onDestroy(): void {
        NetworkManager.Instance.unlisten(ApiMsgEnum.MsgRoom, this._onRoomSync, this);
    }

    private _onRoomSync(data: IMsgRoom) {
        DataManager.Instance.roomInfo = data.room;

        this._render();
    }

    private _render() {
        this.roomNameLabel.string = DataManager.Instance.roomInfo.name;
        this.startButton.active = DataManager.Instance.isMe(DataManager.Instance.roomInfo.ownerId);

        const canStart = DataManager.Instance.roomInfo.players.length >= 2;
        this.startButton.getComponent(Button).interactable = canStart;
        this.startButton.getComponent(UIOpacity).opacity = canStart ? 255 : 100;

        this._renderPlayerList(DataManager.Instance.roomInfo.players);
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
            this.playerContainer.children[i].getComponent(PlayerItemManager).init(list[i]);
        }
    }

    public async handleClickLeave() {}

    public async handleClickStart() {}
}
