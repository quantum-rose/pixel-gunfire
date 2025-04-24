import { _decorator, Component, Label } from 'cc';
import { IRoom } from '../Common';
const { ccclass, property } = _decorator;

@ccclass('RoomManager')
export class RoomManager extends Component {
    @property(Label)
    public nameLabel: Label;

    public id: number;

    public init(room: IRoom) {
        this.id = room.id;
        this.nameLabel.string = `${room.name} (${room.players.length})`;
        this.node.active = true;
    }

    public handleClickEnter() {}
}
