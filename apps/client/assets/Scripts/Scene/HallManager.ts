import { ApiMsgEnum, IMsgPlayerList, IMsgRoomList, IPlayer, IRoom } from '@pixel-gunfire/common';
import { _decorator, Component, director, instantiate, Label, Node, Prefab } from 'cc';
import { SceneEnum } from '../Enum';
import { DataManager, NetworkManager } from '../Global';
import { PlayerItemManager } from '../UI/PlayerItemManager';
import { RoomItemManager } from '../UI/RoomItemManager';
const { ccclass, property } = _decorator;

@ccclass('HallManager')
export class HallManager extends Component {
    @property(Label)
    public playerNameLabel: Label;

    @property(Node)
    public playerContainer: Node;

    @property(Prefab)
    public playerPrefab: Prefab;

    @property(Node)
    public roomContainer: Node;

    @property(Prefab)
    public roomPrefab: Prefab;

    protected onLoad(): void {
        this.playerNameLabel.string = DataManager.Instance.playerInfo.nickname;
    }

    protected start(): void {
        NetworkManager.Instance.listen(ApiMsgEnum.MsgPlayerList, this._onPlayerListSync, this);
        NetworkManager.Instance.listen(ApiMsgEnum.MsgRoomList, this._onRoomListSync, this);

        this._getPlayerList();
        this._getRoomList();
    }

    protected onDestroy(): void {
        NetworkManager.Instance.unlisten(ApiMsgEnum.MsgPlayerList, this._onPlayerListSync, this);
        NetworkManager.Instance.unlisten(ApiMsgEnum.MsgRoomList, this._onRoomListSync, this);
    }

    private async _getPlayerList(): Promise<void> {
        const { success, res, error } = await NetworkManager.Instance.callApi(ApiMsgEnum.ApiPlayerList, {});

        if (success) {
            this._renderPlayerList(res.list);
        } else {
            console.error('Error fetching player list:', error);
        }
    }

    private _onPlayerListSync(data: IMsgPlayerList) {
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
            this.playerContainer.children[i].getComponent(PlayerItemManager).init(list[i]);
        }
    }

    private async _getRoomList(): Promise<void> {
        const { success, res, error } = await NetworkManager.Instance.callApi(ApiMsgEnum.ApiRoomList, {});

        if (success) {
            this._renderRoomList(res.list);
        } else {
            console.error('Error fetching room list:', error);
        }
    }

    private _onRoomListSync(data: IMsgRoomList) {
        this._renderRoomList(data.list);
    }

    private _renderRoomList(list: IRoom[]) {
        for (const child of this.roomContainer.children) {
            child.active = false;
        }

        while (this.roomContainer.children.length < list.length) {
            const roomNode = instantiate(this.roomPrefab);
            roomNode.active = false;
            roomNode.setParent(this.roomContainer);
        }

        for (let i = 0; i < list.length; i++) {
            this.roomContainer.children[i].getComponent(RoomItemManager).init(list[i]);
        }
    }

    public async handleClickCreateRoom() {
        const { success, res, error } = await NetworkManager.Instance.callApi(ApiMsgEnum.ApiRoomCreate, { name: '' });

        if (success) {
            DataManager.Instance.syncRoom(res);

            director.loadScene(SceneEnum.Battle);
        } else {
            console.error('Error creating room:', error);
        }
    }
}
