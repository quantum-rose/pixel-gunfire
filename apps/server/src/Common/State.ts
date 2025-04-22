import { EntityTypeEnum, InputTypeEnum } from './Enum';

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

export type IInput = IActorMove | IWeaponShoot | ITimePast;
