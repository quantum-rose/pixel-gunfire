import { _decorator, Button, Color, Component, director, Label } from 'cc';
import { ApiMsgEnum, IRoom } from '../Common';
import { SceneEnum } from '../Enum';
import DataManager from '../Global/DataManager';
import { NetworkManager } from '../Global/NetworkManager';
const { ccclass, property } = _decorator;

@ccclass('RoomManager')
export class RoomManager extends Component {
    @property(Label)
    public nameLabel: Label;

    @property(Button)
    public joinButton: Button;

    @property(Label)
    public joinButtonLabel: Label;

    public id: number;

    public init(room: IRoom) {
        this.id = room.id;
        this.nameLabel.string = `${room.name}  ( ${room.players.length} / ${room.maxPlayers} )`;

        const isFull = room.players.length >= room.maxPlayers;
        this.joinButton.interactable = !isFull;
        this.joinButtonLabel.string = isFull ? '人数已满' : '加入房间';
        this.joinButtonLabel.color = isFull ? new Color(128, 128, 128) : new Color(255, 255, 255);

        this.node.active = true;
    }

    public async handleClickJoin() {
        const { success, res, error } = await NetworkManager.Instance.callApi(ApiMsgEnum.ApiRoomJoin, { roomId: this.id });

        if (success) {
            DataManager.Instance.roomInfo = res.room;

            director.loadScene(SceneEnum.Room);
        } else {
            console.error('Error joining room:', error);
        }
    }
}
