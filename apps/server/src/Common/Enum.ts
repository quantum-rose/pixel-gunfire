export enum InputTypeEnum {
    ActorMove = 'ActorMove',
    WeaponShoot = 'WeaponShoot',
    TimePast = 'TimePast',
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
}

export enum ApiMsgEnum {
    ApiPlayerJoin = 'ApiPlayerJoin',
    ApiPlayerList = 'ApiPlayerList',
    ApiRoomCreate = 'ApiRoomCreate',
    ApiRoomList = 'ApiRoomList',
    ApiRoomJoin = 'ApiRoomJoin',
    ApiRoomLeave = 'ApiRoomLeave',
    ApiGameStart = 'ApiGameStart',

    MsgPlayerList = 'MsgPlayerList',
    MsgRoomList = 'MsgRoomList',
    MsgRoom = 'MsgRoom',
    MsgGameStart = 'MsgGameStart',
    MsgClientSync = 'MsgClientSync',
    MsgServerSync = 'MsgServerSync',
}
