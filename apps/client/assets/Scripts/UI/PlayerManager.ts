import { _decorator, Component, Label } from 'cc';
import { IPlayer } from '../Common';
import DataManager from '../Global/DataManager';
const { ccclass, property } = _decorator;

@ccclass('PlayerManager')
export class PlayerManager extends Component {
    @property(Label)
    public nameLabel: Label;

    public id: number;

    public init(player: IPlayer, showState: boolean = true) {
        this.id = player.id;

        let state = '空闲';
        if (player.roomId) {
            state = `房间 ${player.roomId.toString().padStart(2, '0')}`;
        }

        this.nameLabel.string = showState ? `${player.nickname} (${state})` : player.nickname;
        this.nameLabel.isBold = DataManager.Instance.isMe(player.id);
        this.node.active = true;
    }
}
