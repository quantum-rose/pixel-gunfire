import { Node, Prefab, SpriteFrame, UITransform } from 'cc';
import Singleton from '../Base/Singleton';
import { EntityTypeEnum, IActorMove, IBullet, IInput, InputTypeEnum, IState, ITimePast, IWeaponShoot } from '../Common';
import { ActorManager } from '../Entity/Actor/ActorManager';
import { BulletManager } from '../Entity/Bullet/BulletManager';
import { EventEnum } from '../Enum';
import { JoyStickManager } from '../UI/JoyStickManager';
import EventManager from './EventManager';

const ACTOR_SPEED = 100;
const BULLET_SPEED = 600;

export default class DataManager extends Singleton {
    static get Instance() {
        return super.GetInstance<DataManager>();
    }

    public jm: JoyStickManager;

    private _stage: Node;

    public get stage() {
        return this._stage;
    }

    public set stage(value: Node) {
        this._stage = value;
        const stageTransform = this._stage.getComponent(UITransform);
        this._stageWidth = stageTransform.width;
        this._stageHeight = stageTransform.height;
    }

    private _stageWidth: number;

    private _stageHeight: number;

    public prefabMap = new Map<string, Prefab>();

    public textureMap = new Map<string, SpriteFrame[]>();

    public actorMap = new Map<number, ActorManager>();

    public bulletMap = new Map<number, BulletManager>();

    public state: IState = {
        actors: [
            {
                type: EntityTypeEnum.Actor1,
                weaponType: EntityTypeEnum.Weapon1,
                bulletType: EntityTypeEnum.Bullet2,
                id: 0,
                position: { x: 0, y: 0 },
                direction: { x: 1, y: 0 },
            },
        ],
        bullets: [],
        nextBulletId: 1,
    };

    public applyInput(input: IInput) {
        switch (input.type) {
            case InputTypeEnum.ActorMove:
                this._applyActorMove(input);
                break;
            case InputTypeEnum.WeaponShoot:
                this._applyWeaponShoot(input);
                break;
            case InputTypeEnum.TimePast:
                this._applyTimePast(input);
                break;
        }
    }

    private _applyActorMove(input: IActorMove) {
        const actor = this.state.actors.find(actor => actor.id === input.id);
        if (!actor) {
            return;
        }

        const {
            direction: { x, y },
            dt,
        } = input;

        actor.direction.x = x;
        actor.direction.y = y;

        actor.position.x += x * dt * ACTOR_SPEED;
        actor.position.y += y * dt * ACTOR_SPEED;

        if (actor.position.x < -this._stageWidth / 2) {
            actor.position.x = -this._stageWidth / 2;
        } else if (actor.position.x > this._stageWidth / 2) {
            actor.position.x = this._stageWidth / 2;
        }
        if (actor.position.y < -this._stageHeight / 2) {
            actor.position.y = -this._stageHeight / 2;
        } else if (actor.position.y > this._stageHeight / 2) {
            actor.position.y = this._stageHeight / 2;
        }
    }

    private _applyWeaponShoot(input: IWeaponShoot) {
        const actor = this.state.actors.find(actor => actor.id === input.owner);
        if (!actor) {
            return;
        }

        const { position, direction } = input;
        const bullet: IBullet = {
            type: actor.bulletType,
            id: this.state.nextBulletId++,
            owner: actor.id,
            position: { x: position.x, y: position.y },
            direction: { x: direction.x, y: direction.y },
        };
        this.state.bullets.push(bullet);
    }

    private _applyTimePast(input: ITimePast) {
        const { dt } = input;
        for (let i = this.state.bullets.length - 1; i >= 0; i--) {
            const bullet = this.state.bullets[i];
            if (
                bullet.position.x < -this._stageWidth / 2 ||
                bullet.position.x > this._stageWidth / 2 ||
                bullet.position.y < -this._stageHeight / 2 ||
                bullet.position.y > this._stageHeight / 2
            ) {
                this.state.bullets.splice(i, 1);
                EventManager.Instance.emit(EventEnum.ExplosionBorn, bullet.id, bullet.position);
                continue;
            }
            bullet.position.x += bullet.direction.x * dt * BULLET_SPEED;
            bullet.position.y += bullet.direction.y * dt * BULLET_SPEED;
        }
    }
}

window['DataManager'] = DataManager.Instance;
