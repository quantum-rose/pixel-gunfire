import { ApiMsgEnum, EntityTypeEnum, IActor, IClientInput, IMsgClientSync, InputTypeEnum, IPlayer, IRoom, State, toFixed } from '../Common';
import type { Connection } from '../Core';
import { Vector2 } from '../Utils/Vector2';
import { Player } from './Player';

export class Room {
    private static _nextId: number = 1;

    public id: number;

    public name: string;

    public owner: Player;

    public players = new Set<Player>();

    private _connectionIdToFrameId = new Map<number, number>();

    public maxPlayers: number = 4;

    public get isFull() {
        return this.players.size >= this.maxPlayers;
    }

    public get isEmpty() {
        return this.players.size === 0;
    }

    public state = new State();

    private _pendingInput: IClientInput[] = [];

    private _lastTime: number = null;

    private _timePastTimer: NodeJS.Timer | null = null;

    private _syncTimer: NodeJS.Timer | null = null;

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
        this._addActor(player);
        this._connectionIdToFrameId.set(player.connection.id, 0);
        player.connection.listen(ApiMsgEnum.MsgClientSync, this._getClientSync, this);
    }

    private _addActor(player: Player) {
        let type: EntityTypeEnum;
        let weaponType: EntityTypeEnum;
        let bulletType: EntityTypeEnum;
        if ((player.id + this.id) % 2 === 0) {
            type = EntityTypeEnum.Actor1;
            weaponType = EntityTypeEnum.Weapon1;
            bulletType = EntityTypeEnum.Bullet1;
        } else {
            type = EntityTypeEnum.Actor2;
            weaponType = EntityTypeEnum.Weapon2;
            bulletType = EntityTypeEnum.Bullet2;
        }

        const direction = new Vector2(1, 0).rotate(Math.random() * 2 * Math.PI).normalize();
        const position = direction.clone().scale((Math.random() + 1) * 320);

        const actor: IActor = {
            type,
            weaponType,
            bulletType,
            id: player.id,
            position: { x: position.x, y: position.y },
            direction: { x: -direction.x, y: -direction.y },
            hp: 100,
            nickname: player.nickname,
        };

        this.state.addActor(actor);
    }

    public removePlayer(player: Player) {
        this.players.delete(player);
        player.roomId = null;
        this._removeActor(player);
        this._connectionIdToFrameId.delete(player.connection.id);
        player.connection.unlisten(ApiMsgEnum.MsgClientSync, this._getClientSync, this);

        if (this.owner === player && !this.isEmpty) {
            this.owner = [...this.players][0];
        }
    }

    private _removeActor(player: Player) {
        this.state.removeActor(player.id);
    }

    public start() {
        this._timePastTimer = setInterval(() => {
            this._timePast();
        }, 16);

        this._syncTimer = setInterval(() => {
            this._sendServerSync();
        }, 100);
    }

    public stop() {
        this._lastTime = null;
        if (this._timePastTimer) {
            clearInterval(this._timePastTimer);
            this._timePastTimer = null;
        }

        if (this._syncTimer) {
            clearInterval(this._syncTimer);
            this._syncTimer = null;
        }
    }

    private _timePast() {
        const now = process.uptime();
        const dt = this._lastTime ? now - this._lastTime : 0;
        this._pendingInput.push({
            type: InputTypeEnum.TimePast,
            dt: toFixed(dt),
        });
        this._lastTime = now;
    }

    private _getClientSync(connection: Connection, { input, frameId }: IMsgClientSync) {
        this._pendingInput.push(input);
        this._connectionIdToFrameId.set(connection.id, frameId);
    }

    private _sendServerSync() {
        if (this._pendingInput.length === 0) {
            return;
        }

        this._pendingInput.forEach(input => {
            this.state.applyInput(input);
        });

        this.players.forEach(player => {
            player.connection.send(ApiMsgEnum.MsgServerSync, {
                lastFrameId: this._connectionIdToFrameId.get(player.connection.id),
                inputs: this._pendingInput,
            });
        });

        this._pendingInput.length = 0;
    }
}
