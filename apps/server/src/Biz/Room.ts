import { ApiMsgEnum, EntityTypeEnum, IActor, IClientInput, IMsgClientSync, IPlayer, IRoom, IState } from '../Common';
import type { Connection } from '../Core';
import { Vector2 } from '../Utils/Vector2';
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

    private _pendingInput: IClientInput[] = [];

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
    }

    public removePlayer(player: Player) {
        this.players.delete(player);
        player.roomId = null;

        if (this.owner === player && !this.isEmpty) {
            this.owner = [...this.players][0];
        }
    }

    public start() {
        const range = (2 * Math.PI) / this.players.size;
        const actors: IActor[] = [...this.players].map((player, index) => {
            let type: EntityTypeEnum;
            let weaponType: EntityTypeEnum;
            let bulletType: EntityTypeEnum;
            if (index % 2 === 0) {
                type = EntityTypeEnum.Actor1;
                weaponType = EntityTypeEnum.Weapon1;
                bulletType = EntityTypeEnum.Bullet1;
            } else {
                type = EntityTypeEnum.Actor2;
                weaponType = EntityTypeEnum.Weapon2;
                bulletType = EntityTypeEnum.Bullet2;
            }

            const direction = new Vector2(1, 0).rotate((Math.random() + index) * range).normalize();
            const position = direction.clone().scale(Math.random() * 320 + 320);

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
            return actor;
        });

        const state: IState = {
            actors,
            bullets: [],
            nextBulletId: 1,
        };

        this.players.forEach(player => {
            player.connection.send(ApiMsgEnum.MsgGameStart, {
                state,
            });

            player.connection.listen(ApiMsgEnum.MsgClientSync, this._getClientSync, this);
        });

        this._syncTimer = setInterval(() => {
            this._sendServerSync();
        }, 0);
    }

    public stop() {
        this.players.forEach(player => {
            player.connection.unlisten(ApiMsgEnum.MsgClientSync, this._getClientSync, this);
        });

        if (this._syncTimer) {
            clearInterval(this._syncTimer);
            this._syncTimer = null;
        }
    }

    private _getClientSync(connection: Connection, { input, frameId }: IMsgClientSync) {
        this._pendingInput.push(input);
    }

    private _sendServerSync() {
        this.players.forEach(player => {
            player.connection.send(ApiMsgEnum.MsgServerSync, {
                lastFrameId: 0,
                inputs: this._pendingInput,
            });
        });
        this._pendingInput.length = 0;
    }
}
