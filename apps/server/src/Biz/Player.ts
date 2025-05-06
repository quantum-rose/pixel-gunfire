import { IPlayer } from '@pixel-gunfire/common';
import { Connection } from '../Core';

export class Player {
    private static _nextId: number = 1;

    public id: number;

    public nickname: string;

    public connection: Connection;

    public roomId: number = null;

    constructor(nickname: string, connection: Connection) {
        this.id = Player._nextId++;
        this.nickname = nickname;
        this.connection = connection;
    }

    public dump(): IPlayer {
        return {
            id: this.id,
            nickname: this.nickname,
            roomId: this.roomId,
        };
    }
}
