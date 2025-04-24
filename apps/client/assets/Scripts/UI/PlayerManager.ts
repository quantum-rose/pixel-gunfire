import { _decorator, Component, Label } from 'cc';
import { IPlayer } from '../Common';
const { ccclass, property } = _decorator;

@ccclass('PlayerManager')
export class PlayerManager extends Component {
    public id: number;

    public init(player: IPlayer) {
        this.id = player.id;

        let state = '空闲';
        if (player.roomId) {
            state = `房间 ${player.roomId.toString().padStart(2, '0')}`;
        }

        this.node.getComponent(Label).string = `${player.nickname} (${state})`;
        this.node.active = true;
    }
}
