export interface IPlayer {
    id: number;
    nickname: string;
    roomId: number;
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
