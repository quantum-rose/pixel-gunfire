import { IPlayer } from '../Common';
import { Connection } from '../Core';

export class Player {
    private static _nextId: number = 1;

    public id: number;

    public nickname: string;

    public connection?: Connection;

    public roomId: number = null;

    public isBot: boolean = false;

    constructor(nickname: string, connection?: Connection) {
        this.id = Player._nextId++;
        this.nickname = nickname;
        this.connection = connection;
        this.isBot = !connection;
    }

    public dump(): IPlayer {
        return {
            id: this.id,
            nickname: this.nickname,
            roomId: this.roomId,
        };
    }
}
