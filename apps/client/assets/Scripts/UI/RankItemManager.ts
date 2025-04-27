import { _decorator, Color, Component, Label, Vec3 } from 'cc';
import { IActor } from '../Common';
import DataManager from '../Global/DataManager';
const { ccclass, property } = _decorator;

@ccclass('RankItemManager')
export class RankItemManager extends Component {
    private static _labelColors = [new Color(255, 223, 0), new Color(220, 220, 220), new Color(210, 140, 120), new Color(190, 190, 190)];

    private static _outlineColors = [new Color(64, 55, 0), new Color(55, 55, 55), new Color(52, 35, 15), new Color(20, 20, 20)];

    public id: number = 0;

    public init(id: number, index: number) {
        this.id = id;
        this.node.setPosition(0, index * -24, 0);
    }

    public render(actor: IActor, index: number) {
        const { nickname, damage } = actor;
        let text = `${index + 1}. ${nickname}`;
        if (DataManager.Instance.isMe(actor.id)) {
            text += ' (我)';
        }
        text += ` ${damage}`;
        const label = this.node.getComponent(Label);
        label.string = text;

        if (index < 3) {
            label.color = RankItemManager._labelColors[index];
            label.outlineColor = RankItemManager._outlineColors[index];
        } else {
            label.color = RankItemManager._labelColors[3];
            label.outlineColor = RankItemManager._outlineColors[3];
        }

        this.node.setPosition(Vec3.lerp(new Vec3(), this.node.getPosition(), new Vec3(0, index * -24), 0.1));
    }
}
