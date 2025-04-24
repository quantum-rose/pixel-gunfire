import { IPlayer, IRoom } from '../Common';
import { Player } from './Player';

export class Room {
    private static _nextId: number = 1;

    public id: number;

    public name: string;

    public players = new Set<Player>();

    public get isFull() {
        return this.players.size >= 4;
    }

    public get isEmpty() {
        return this.players.size === 0;
    }

    constructor(_name: string) {
        this.id = Room._nextId++;
        this.name = `房间 ${this.id.toString().padStart(2, '0')}`;
    }

    public dump(): IRoom {
        const players: IPlayer[] = [];
        this.players.forEach(player => {
            players.push(player.dump());
        });
        return {
            id: this.id,
            name: this.name,
            players,
            isFull: this.isFull,
        };
    }

    public addPlayer(player: Player) {
        this.players.add(player);
        player.roomId = this.id;
    }

    public removePlayer(player: Player) {
        this.players.delete(player);
        player.roomId = null;
    }
}
