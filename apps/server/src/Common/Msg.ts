import { IPlayer, IRoom } from './Api';
import { IInput } from './State';

export interface IMsgClientSync {
    input: IInput;
    frameId: number;
}

export interface IMsgServerSync {
    inputs: IInput[];
    lastFrameId: number;
}

export interface IMsgPlayerList {
    list: IPlayer[];
}

export interface IMsgRoomList {
    list: IRoom[];
}
