import { ACTOR_SPEED, BULLET_DAMAGE, BULLET_SPEED, HIT_RADIUS, STAGE_HEIGHT, STAGE_WIDTH } from './Constants';
import { EntityTypeEnum, InputTypeEnum, StateEventEnum } from './Enum';
import { toFixed } from './Util';

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
    seed: number;
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

    public bullets = new Map<number, IBullet>();

    public nextBulletId = 1;

    public seed = Date.now() % 233280;

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

        let xPos = actor.position.x + x * dt * ACTOR_SPEED;
        let yPos = actor.position.y + y * dt * ACTOR_SPEED;

        if (xPos < -STAGE_WIDTH / 2) {
            xPos = -STAGE_WIDTH / 2;
        } else if (xPos > STAGE_WIDTH / 2) {
            xPos = STAGE_WIDTH / 2;
        }
        if (yPos < -STAGE_HEIGHT / 2) {
            yPos = -STAGE_HEIGHT / 2;
        } else if (yPos > STAGE_HEIGHT / 2) {
            yPos = STAGE_HEIGHT / 2;
        }

        actor.position.x = toFixed(xPos);
        actor.position.y = toFixed(yPos);
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

        this.bullets.set(bullet.id, bullet);
    }

    private _applyTimePast(input: ITimePast) {
        const { dt } = input;
        for (const bullet of this.bullets.values()) {
            if (this._hitActor(bullet) || this._hitEdge(bullet)) {
                this.bullets.delete(bullet.id);
                this.emit(StateEventEnum.ExplosionBorn, bullet.id, bullet.position);
            } else {
                bullet.position.x = toFixed(bullet.position.x + bullet.direction.x * dt * BULLET_SPEED);
                bullet.position.y = toFixed(bullet.position.y + bullet.direction.y * dt * BULLET_SPEED);
            }
        }
    }

    private _hitActor(bullet: IBullet): boolean {
        for (const actor of this.actors.values()) {
            if (actor.id === bullet.owner) {
                continue;
            }

            if ((bullet.position.x - actor.position.x) ** 2 + (bullet.position.y - actor.position.y - 40) ** 2 < HIT_RADIUS ** 2) {
                this.seed = this._randomBySeed(this.seed);
                const crit = this.seed / 233280 < 0.25;
                const damage = crit ? BULLET_DAMAGE * 2 : BULLET_DAMAGE;
                actor.hp -= damage;
                this.emit(StateEventEnum.DamageBorn, actor.id, damage, crit);
                return true;
            }
        }
        return false;
    }

    private _hitEdge(bullet: IBullet): boolean {
        return (
            bullet.position.x < -STAGE_WIDTH / 2 ||
            bullet.position.x > STAGE_WIDTH / 2 ||
            bullet.position.y < -STAGE_HEIGHT / 2 ||
            bullet.position.y > STAGE_HEIGHT / 2
        );
    }

    private _randomBySeed(seed: number) {
        console.log(seed);
        return (seed * 9301 + 49297) % 233280;
    }

    public load(data: IState) {
        this.actors.clear();
        for (const actor of data.actors) {
            this.actors.set(actor.id, {
                ...actor,
                position: { ...actor.position },
                direction: { ...actor.direction },
            });
        }
        this.bullets.clear();
        for (const bullet of data.bullets) {
            this.bullets.set(bullet.id, {
                ...bullet,
                position: { ...bullet.position },
                direction: { ...bullet.direction },
            });
        }
        this.nextBulletId = data.nextBulletId;
        this.seed = data.seed;
        return this;
    }

    public dump(): IState {
        const actors: IActor[] = [];
        for (const actor of this.actors.values()) {
            actors.push({
                ...actor,
                position: { ...actor.position },
                direction: { ...actor.direction },
            });
        }
        const bullets: IBullet[] = [];
        for (const bullet of this.bullets.values()) {
            bullets.push({
                ...bullet,
                position: { ...bullet.position },
                direction: { ...bullet.direction },
            });
        }
        return {
            actors,
            bullets,
            nextBulletId: this.nextBulletId,
            seed: this.seed,
        };
    }

    public reset() {
        this.actors.clear();
        this.bullets.clear();
        this.nextBulletId = 1;
    }

    private _map: Map<StateEventEnum, Array<IItem>> = new Map();

    public on(event: StateEventEnum, cb: Function, ctx: unknown) {
        if (this._map.has(event)) {
            this._map.get(event).push({ cb, ctx });
        } else {
            this._map.set(event, [{ cb, ctx }]);
        }
    }

    public off(event: StateEventEnum, cb: Function, ctx: unknown) {
        if (this._map.has(event)) {
            const index = this._map.get(event).findIndex(i => cb === i.cb && i.ctx === ctx);
            index > -1 && this._map.get(event).splice(index, 1);
        }
    }

    public emit(event: StateEventEnum, ...params: unknown[]) {
        if (this._map.has(event)) {
            this._map.get(event).forEach(({ cb, ctx }) => {
                cb.apply(ctx, params);
            });
        }
    }
}
