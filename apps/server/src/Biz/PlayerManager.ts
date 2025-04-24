import Singleton from '../Base/Singleton';
import { ApiMsgEnum, IPlayer } from '../Common';
import type { Connection } from '../Core';
import { Player } from './Player';

export class PlayerManager extends Singleton {
    static get Instance() {
        return super.GetInstance<PlayerManager>();
    }

    private _id2Player: Map<number, Player> = new Map();
    private _nickname2Player: Map<string, Player> = new Map();
    private _connection2Player: Map<number, Player> = new Map();

    public get isFull() {
        return this._id2Player.size >= 100;
    }

    public createPlayer(nickname: string, connection: Connection) {
        const player = new Player(nickname, connection);
        this._id2Player.set(player.id, player);
        this._nickname2Player.set(player.nickname, player);
        this._connection2Player.set(connection.id, player);

        PlayerManager.Instance.syncPlayers();

        console.log(`Player joined: ${player.id}, ${player.nickname}, Total: ${this._id2Player.size}`);

        return player;
    }

    public removePlayer(player: Player) {
        this._id2Player.delete(player.id);
        this._nickname2Player.delete(player.nickname);
        this._connection2Player.delete(player.connection.id);

        PlayerManager.Instance.syncPlayers();

        console.log(`Player left: ${player.id}, ${player.nickname}, Remaining: ${this._id2Player.size}`);
    }

    public removePlayerByConnection(connectionId: number) {
        const player = this._connection2Player.get(connectionId);
        if (player) {
            this.removePlayer(player);
        }
    }

    public syncPlayers() {
        const playerList = this.dumpAllPlayers();
        this._id2Player.forEach(player => {
            player.connection.send(ApiMsgEnum.MsgPlayerList, {
                list: playerList,
            });
        });
    }

    public getPlayer(id: number) {
        return this._id2Player.get(id);
    }

    public getPlayerByNickname(nickname: string) {
        return this._nickname2Player.get(nickname);
    }

    public getPlayerByConnection(connectionId: number) {
        return this._connection2Player.get(connectionId);
    }

    public getAllPlayers() {
        return Array.from(this._id2Player.values());
    }

    public dumpAllPlayers() {
        const players: IPlayer[] = [];
        this._id2Player.forEach(player => {
            players.push(player.dump());
        });
        return players;
    }
}
