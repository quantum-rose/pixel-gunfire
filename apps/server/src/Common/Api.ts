export interface IPlayer {
    id: number;
    nickname: string;
    roomId: number;
}

export interface IRoom {
    id: number;
    name: string;
    players: IPlayer[];
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
