import { IPlayer } from '@pixel-gunfire/common';
import { _decorator, Component, Label } from 'cc';
import { DataManager } from '../Global';
const { ccclass, property } = _decorator;

@ccclass('PlayerItemManager')
export class PlayerItemManager extends Component {
    @property(Label)
    public nameLabel: Label;

    @property(Label)
    public stateLabel: Label;

    public id: number;

    public init(player: IPlayer) {
        this.id = player.id;

        this.nameLabel.string = player.nickname;

        let state = '';
        if (DataManager.Instance.roomInfo !== null) {
            state = player.id === DataManager.Instance.roomInfo.ownerId ? '房主' : '';
        } else {
            if (DataManager.Instance.isMe(player.id)) {
                state = '我';
            } else if (player.roomId) {
                state = `房间 ${player.roomId.toString().padStart(2, '0')}`;
            } else {
                state = '空闲';
            }
        }
        this.stateLabel.string = state;

        this.node.active = true;
    }
}
