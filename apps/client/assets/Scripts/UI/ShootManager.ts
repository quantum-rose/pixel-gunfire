import { _decorator, Color, Component, EventTouch, Input, input, Node, Sprite, sys, UITransform, Vec2 } from 'cc';
import { EventEnum } from '../Enum';
import EventManager from '../Global/EventManager';
const { ccclass, property } = _decorator;

@ccclass('ShootManager')
export class ShootManager extends Component {
    private _body: Node;

    private _defaultPos: Vec2;

    private _touchId: number = null;

    protected onLoad(): void {
        this._body = this.node.getChildByName('Body');
        this._body.active = false;
        this._defaultPos = new Vec2(this._body.position.x, this._body.position.y);

        input.on(Input.EventType.TOUCH_START, this._onTouchStart, this);
        input.on(Input.EventType.TOUCH_END, this._onTouchEnd, this);
    }

    protected onDestroy(): void {
        input.off(Input.EventType.TOUCH_START, this._onTouchStart, this);
        input.off(Input.EventType.TOUCH_END, this._onTouchEnd, this);
    }

    private _onTouchStart(event: EventTouch): void {
        if (this._touchId !== null) {
            return;
        }

        const touchPos = event.getUILocation();
        if (sys.isMobile && touchPos.x < this.node.parent.getComponent(UITransform).width / 2) {
            return;
        }

        this._touchId = event.getID();

        this._body.setPosition(touchPos.x, touchPos.y);
        this._body.getComponent(Sprite).color = new Color(255, 255, 255, 150);

        this._emitWeaponShoot();
        this.schedule(this._emitWeaponShoot, 0.2);
    }

    private _onTouchEnd(event: EventTouch): void {
        if (this._touchId === null || event.getID() !== this._touchId) {
            return;
        }
        this._touchId = null;

        this._body.setPosition(this._defaultPos.x, this._defaultPos.y);
        this._body.getComponent(Sprite).color = new Color(255, 255, 255, 100);
        this.unschedule(this._emitWeaponShoot);
    }

    private _emitWeaponShoot() {
        EventManager.Instance.emit(EventEnum.WeaponShoot);
    }
}
