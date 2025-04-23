import { IInput } from './State';

export interface IMsgClientSync {
    input: IInput;
    frameId: number;
}

export interface IMsgServerSync {
    inputs: IInput[];
    lastFrameId: number;
}
