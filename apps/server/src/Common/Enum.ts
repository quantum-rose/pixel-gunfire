export enum InputTypeEnum {
    ActorMove,
    WeaponShoot,
    TimePast,
}

export enum EntityTypeEnum {
    Map = 'Map',
    Actor1 = 'Actor1',
    Actor2 = 'Actor2',
    Weapon1 = 'Weapon1',
    Weapon2 = 'Weapon2',
    Bullet1 = 'Bullet1',
    Bullet2 = 'Bullet2',
    Explosion = 'Explosion',
    Damage = 'Damage',
}

export enum ApiMsgEnum {
    ApiPlayerJoin,
    ApiPlayerList,
    ApiRoomCreate,
    ApiRoomList,
    ApiRoomJoin,
    ApiRoomLeave,

    MsgPlayerList,
    MsgRoomList,
    MsgRoom,
    MsgClientSync,
    MsgServerSync,
}

export enum StateEventEnum {
    /**
     * 子弹命中目标后爆炸
     */
    ExplosionBorn = 'ExplosionBorn',
    /**
     * 子弹命中目标后造成伤害
     */
    DamageBorn = 'DamageBorn',
}
