export interface IPlayer {
    id: number;
    nickname: string;
    roomId: number;
}

export interface IRoom {
    id: number;
    name: string;
    ownerId: number;
    players: IPlayer[];
    maxPlayers: number;
}

export interface IApiPlayerJoinReq {
    nickname: string;
}

export interface IApiPlayerJoinRes {
    player: IPlayer;
}

export interface IApiPlayerListReq {}

export interface IApiPlayerListRes {
    list: IPlayer[];
}

export interface IApiRoomCreateReq {
    name: string;
}

export interface IApiRoomCreateRes {
    room: IRoom;
}

export interface IApiRoomListReq {}

export interface IApiRoomListRes {
    list: IRoom[];
}

export interface IApiRoomJoinReq {
    roomId: number;
}

export interface IApiRoomJoinRes {
    room: IRoom;
}

export interface IApiRoomLeaveReq {}

export interface IApiRoomLeaveRes {}
