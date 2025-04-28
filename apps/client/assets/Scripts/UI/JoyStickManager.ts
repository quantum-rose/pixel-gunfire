import { _decorator, Component, EventKeyboard, EventTouch, input, Input, KeyCode, Node, sys, UITransform, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('JoyStickManager')
export class JoyStickManager extends Component {
    public input: Vec2 = new Vec2(0, 0);

    private _keys: Set<KeyCode> = new Set();

    private _body: Node;

    private _stick: Node;

    private _defaultPos: Vec2;

    private _radius: number;

    private _touchId: number = null;

    protected onLoad(): void {
        this._body = this.node.getChildByName('Body');
        this._body.active = false;
        this._stick = this._body.getChildByName('Stick');
        this._defaultPos = new Vec2(this._body.position.x, this._body.position.y);
        this._radius = this._body.getComponent(UITransform).width / 2;

        if (sys.isMobile) {
            input.on(Input.EventType.TOUCH_START, this._onTouchStart, this);
            input.on(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
            input.on(Input.EventType.TOUCH_END, this._onTouchEnd, this);
        } else {
            input.on(Input.EventType.KEY_DOWN, this._onKeyDown, this);
            input.on(Input.EventType.KEY_UP, this._onKeyUp, this);
        }
    }

    protected onEnable(): void {
        if (sys.isBrowser) {
            window.addEventListener('blur', this._onWindowBlur.bind(this));
        }
    }

    protected onDisable(): void {
        if (sys.isBrowser) {
            window.removeEventListener('blur', this._onWindowBlur.bind(this));
        }
    }

    private _onWindowBlur(): void {
        this._keys.clear();
        this._updateInputFromKeys();
    }

    protected onDestroy(): void {
        if (sys.isMobile) {
            input.off(Input.EventType.TOUCH_START, this._onTouchStart, this);
            input.off(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
            input.off(Input.EventType.TOUCH_END, this._onTouchEnd, this);
        } else {
            input.off(Input.EventType.KEY_DOWN, this._onKeyDown, this);
            input.off(Input.EventType.KEY_UP, this._onKeyUp, this);
        }
    }

    private _onKeyDown(event: EventKeyboard): void {
        this._keys.add(event.keyCode);
        this._updateInputFromKeys();
    }

    private _onKeyUp(event: EventKeyboard): void {
        this._keys.delete(event.keyCode);
        this._updateInputFromKeys();
    }

    private _updateInputFromKeys(): void {
        let x = 0;
        let y = 0;

        if (this._keys.has(KeyCode.KEY_W)) y += 1;
        if (this._keys.has(KeyCode.KEY_S)) y -= 1;
        if (this._keys.has(KeyCode.KEY_A)) x -= 1;
        if (this._keys.has(KeyCode.KEY_D)) x += 1;

        this.input = new Vec2(x, y).normalize();
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

        this._body.active = true;
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

        this._body.active = false;
        this._body.setPosition(this._defaultPos.x, this._defaultPos.y);

        this._stick.setPosition(0, 0);

        this.input = new Vec2(0, 0);
    }

    public tick(dt: number) {}
}
