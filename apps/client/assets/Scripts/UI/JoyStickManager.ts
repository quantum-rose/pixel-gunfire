import { _decorator, Component, EventTouch, input, Input, Node, UITransform, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('JoyStickManager')
export class JoyStickManager extends Component {
    public input: Vec2 = new Vec2(0, 0);

    private _body: Node;

    private _stick: Node;

    private _defaultPos: Vec2;

    private _radius: number;

    private _touchId: number = null;

    protected onLoad(): void {
        this._body = this.node.getChildByName('Body');
        this._stick = this._body.getChildByName('Stick');
        this._defaultPos = new Vec2(this._body.position.x, this._body.position.y);
        this._radius = this._body.getComponent(UITransform).width / 2;

        input.on(Input.EventType.TOUCH_START, this._onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this._onTouchEnd, this);
    }

    protected onDestroy(): void {
        input.off(Input.EventType.TOUCH_START, this._onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this._onTouchEnd, this);
    }

    private _onTouchStart(event: EventTouch): void {
        if (this._touchId !== null) {
            return;
        }

        const touchPos = event.getUILocation();
        if (touchPos.x > this.node.parent.getComponent(UITransform).width / 2) {
            return;
        }

        this._touchId = event.getID();

        this._body.setPosition(touchPos.x, touchPos.y);
    }

    private _onTouchMove(event: EventTouch): void {
        if (this._touchId === null || event.getID() !== this._touchId) {
            return;
        }

        const touchPos = event.getUILocation();
        const stickPos = new Vec2(touchPos.x - this._body.position.x, touchPos.y - this._body.position.y);

        if (stickPos.length() > this._radius) {
            stickPos.normalize().multiplyScalar(this._radius);
        }

        this._stick.setPosition(stickPos.x, stickPos.y);

        this.input = stickPos.normalize();
    }

    private _onTouchEnd(event: EventTouch): void {
        if (this._touchId === null || event.getID() !== this._touchId) {
            return;
        }
        this._touchId = null;

        this._body.setPosition(this._defaultPos.x, this._defaultPos.y);
        this._stick.setPosition(0, 0);
        this.input = new Vec2(0, 0);
    }
}
