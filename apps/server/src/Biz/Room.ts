import { IPlayer, IRoom } from '../Common';
import { Player } from './Player';

export class Room {
    private static _nextId: number = 1;

    public id: number;

    public name: string;

    public owner: Player;

    public players = new Set<Player>();

    public maxPlayers: number = 4;

    public get isFull() {
        return this.players.size >= this.maxPlayers;
    }

    public get isEmpty() {
        return this.players.size === 0;
    }

    constructor(owner: Player) {
        this.id = Room._nextId++;
        this.name = `房间 ${this.id.toString().padStart(2, '0')}`;
        this.owner = owner;
    }

    public dump(): IRoom {
        const players: IPlayer[] = [];
        this.players.forEach(player => {
            players.push(player.dump());
        });
        return {
            id: this.id,
            name: this.name,
            ownerId: this.owner.id,
            players,
            maxPlayers: this.maxPlayers,
        };
    }

    public addPlayer(player: Player) {
        this.players.add(player);
        player.roomId = this.id;
    }

    public removePlayer(player: Player) {
        this.players.delete(player);
        player.roomId = null;

        if (this.owner === player && !this.isEmpty) {
            this.owner = [...this.players][0];
        }
    }
}
