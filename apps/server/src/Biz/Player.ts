import { Connection } from '../Core';

export class Player {
    private static _nextId: number = 1;

    public id: number;

    public nickname: string;

    public connection: Connection;

    public roomId: number;

    constructor(nickname: string, connection: Connection) {
        this.id = Player._nextId++;
        this.nickname = nickname;
        this.connection = connection;
    }
}
