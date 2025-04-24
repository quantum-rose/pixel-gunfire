import { _decorator, Component, Label } from 'cc';
import { IPlayer } from '../Common';
const { ccclass, property } = _decorator;

@ccclass('PlayerManager')
export class PlayerManager extends Component {
    public id: number;

    public init(player: IPlayer) {
        this.id = player.id;
        this.node.getComponent(Label).string = player.nickname;
        this.node.active = true;
    }
}
