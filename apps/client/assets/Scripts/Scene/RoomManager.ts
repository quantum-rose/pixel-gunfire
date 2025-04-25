import { _decorator, Button, Component, director, instantiate, Label, Node, Prefab, UIOpacity } from 'cc';
import { ApiMsgEnum, IMsgGameStart, IMsgRoom, IPlayer } from '../Common';
import { SceneEnum } from '../Enum';
import DataManager from '../Global/DataManager';
import { NetworkManager } from '../Global/NetworkManager';
import { PlayerManager } from '../UI/PlayerManager';
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
        NetworkManager.Instance.listen(ApiMsgEnum.MsgGameStart, this._onGameStart, this);

        this._render();
    }

    protected onDestroy(): void {
        NetworkManager.Instance.unlisten(ApiMsgEnum.MsgRoom, this._onRoomSync, this);
        NetworkManager.Instance.unlisten(ApiMsgEnum.MsgGameStart, this._onGameStart, this);
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
            this.playerContainer.children[i].getComponent(PlayerManager).init(list[i]);
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

    public async handleClickStart() {
        const { success, error } = await NetworkManager.Instance.callApi(ApiMsgEnum.ApiGameStart, {});

        if (success) {
            //
        } else {
            console.error('Error starting game:', error);
        }
    }

    private _onGameStart(data: IMsgGameStart) {
        DataManager.Instance.loadState(data.state);

        director.loadScene(SceneEnum.Battle);
    }
}
