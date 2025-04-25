import { ACTOR_SPEED, BULLET_DAMAGE, BULLET_SPEED, HIT_RADIUS, STAGE_HEIGHT, STAGE_WIDTH } from './Constants';
import { EntityTypeEnum, InputTypeEnum, StateEventEnum } from './Enum';

export interface IVec2 {
    x: number;
    y: number;
}

export interface IActor {
    type: EntityTypeEnum;
    weaponType: EntityTypeEnum;
    bulletType: EntityTypeEnum;
    id: number;
    position: IVec2;
    direction: IVec2;
    hp: number;
    nickname: string;
}

export interface IBullet {
    type: EntityTypeEnum;
    id: number;
    owner: number;
    position: IVec2;
    direction: IVec2;
}

export interface IState {
    actors: IActor[];
    bullets: IBullet[];
    nextBulletId: number;
}

export interface IActorMove {
    type: InputTypeEnum.ActorMove;
    id: number;
    direction: IVec2;
    dt: number;
}

export interface IWeaponShoot {
    type: InputTypeEnum.WeaponShoot;
    owner: number;
    position: IVec2;
    direction: IVec2;
}

export interface ITimePast {
    type: InputTypeEnum.TimePast;
    dt: number;
}

export type IClientInput = IActorMove | IWeaponShoot | ITimePast;

interface IItem {
    cb: Function;
    ctx: unknown;
}

export class State {
    public actors = new Map<number, IActor>();

    public bullets: IBullet[] = [];

    public nextBulletId = 1;

    public addActor(actor: IActor) {
        this.actors.set(actor.id, actor);
    }

    public removeActor(id: number) {
        this.actors.delete(id);
    }

    public applyInput(input: IClientInput) {
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
        if (!this.actors.has(input.id)) {
            return;
        }
        const actor = this.actors.get(input.id);

        const {
            direction: { x, y },
            dt,
        } = input;

        actor.direction.x = x;
        actor.direction.y = y;

        actor.position.x += x * dt * ACTOR_SPEED;
        actor.position.y += y * dt * ACTOR_SPEED;

        if (actor.position.x < -STAGE_WIDTH / 2) {
            actor.position.x = -STAGE_WIDTH / 2;
        } else if (actor.position.x > STAGE_WIDTH / 2) {
            actor.position.x = STAGE_WIDTH / 2;
        }
        if (actor.position.y < -STAGE_HEIGHT / 2) {
            actor.position.y = -STAGE_HEIGHT / 2;
        } else if (actor.position.y > STAGE_HEIGHT / 2) {
            actor.position.y = STAGE_HEIGHT / 2;
        }
    }

    private _applyWeaponShoot(input: IWeaponShoot) {
        if (!this.actors.has(input.owner)) {
            return;
        }
        const actor = this.actors.get(input.owner);

        const { position, direction } = input;
        const bullet: IBullet = {
            type: actor.bulletType,
            id: this.nextBulletId++,
            owner: actor.id,
            position: { x: position.x, y: position.y },
            direction: { x: direction.x, y: direction.y },
        };

        this.bullets.push(bullet);
    }

    private _applyTimePast(input: ITimePast) {
        const { dt } = input;
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];

            let hit = false;
            for (const actor of this.actors.values()) {
                if (actor.id === bullet.owner) {
                    continue;
                }

                if ((bullet.position.x - actor.position.x) ** 2 + (bullet.position.y - actor.position.y - 40) ** 2 < HIT_RADIUS ** 2) {
                    actor.hp -= BULLET_DAMAGE;
                    this.bullets.splice(i, 1);
                    this.emit(StateEventEnum.ExplosionBorn, bullet.id, bullet.position);
                    hit = true;
                    break;
                }
            }

            if (hit) {
                continue;
            }

            if (
                bullet.position.x < -STAGE_WIDTH / 2 ||
                bullet.position.x > STAGE_WIDTH / 2 ||
                bullet.position.y < -STAGE_HEIGHT / 2 ||
                bullet.position.y > STAGE_HEIGHT / 2
            ) {
                this.bullets.splice(i, 1);
                this.emit(StateEventEnum.ExplosionBorn, bullet.id, bullet.position);
                continue;
            }

            bullet.position.x += bullet.direction.x * dt * BULLET_SPEED;
            bullet.position.y += bullet.direction.y * dt * BULLET_SPEED;
        }
    }

    public load(data: IState) {
        this.actors.clear();
        for (const actor of data.actors) {
            this.actors.set(actor.id, actor);
        }
        this.bullets = data.bullets.slice();
        this.nextBulletId = data.nextBulletId;
    }

    public dump(): IState {
        return {
            actors: Array.from(this.actors.values()),
            bullets: this.bullets.slice(),
            nextBulletId: this.nextBulletId,
        };
    }

    private map: Map<StateEventEnum, Array<IItem>> = new Map();

    on(event: StateEventEnum, cb: Function, ctx: unknown) {
        if (this.map.has(event)) {
            this.map.get(event).push({ cb, ctx });
        } else {
            this.map.set(event, [{ cb, ctx }]);
        }
    }

    off(event: StateEventEnum, cb: Function, ctx: unknown) {
        if (this.map.has(event)) {
            const index = this.map.get(event).findIndex(i => cb === i.cb && i.ctx === ctx);
            index > -1 && this.map.get(event).splice(index, 1);
        }
    }

    emit(event: StateEventEnum, ...params: unknown[]) {
        if (this.map.has(event)) {
            this.map.get(event).forEach(({ cb, ctx }) => {
                cb.apply(ctx, params);
            });
        }
    }

    clear() {
        this.map.clear();
    }
}
