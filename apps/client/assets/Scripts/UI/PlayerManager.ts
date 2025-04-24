import { _decorator, Component, Label } from 'cc';
import { IPlayer } from '../Common';
import DataManager from '../Global/DataManager';
const { ccclass, property } = _decorator;

@ccclass('PlayerManager')
export class PlayerManager extends Component {
    @property(Label)
    public nameLabel: Label;

    @property(Label)
    public stateLabel: Label;

    public id: number;

    public init(player: IPlayer) {
        this.id = player.id;

        this.nameLabel.string = player.nickname + (DataManager.Instance.isMe(player.id) ? '（我）' : '');

        let state = '';
        if (DataManager.Instance.roomInfo !== null) {
            state = player.id === DataManager.Instance.roomInfo.ownerId ? '房主' : '';
        } else {
            state = player.roomId ? `房间 ${player.roomId.toString().padStart(2, '0')}` : '空闲';
        }
        this.stateLabel.string = state;

        this.node.active = true;
    }
}
