import { ApiMsgEnum, EntityTypeEnum, IActor, IClientInput, IMsgClientSync, InputTypeEnum, IPlayer, IRoom, State, toFixed } from '../Common';
import { Vector2 } from '../Common/Vector2';
import type { Connection } from '../Core';
import { Player } from './Player';

export class Room {
    private static _nextId: number = 1;

    public id: number;

    public name: string;

    public owner: Player;

    public players = new Set<Player>();

    private _connectionIdToFrameId = new Map<number, number>();

    private _botIdToShootInterval = new Map<number, number>();

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

    public addBot(bot: Player) {
        this.players.add(bot);
        bot.roomId = this.id;
        this._botIdToShootInterval.set(bot.id, 0);
        this._addActor(bot);
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
        const position = direction.clone().scale((Math.random() + 1) * 480);

        const actor: IActor = {
            type,
            weaponType,
            bulletType,
            id: player.id,
            position: { x: position.x, y: position.y },
            direction: { x: -direction.x, y: -direction.y },
            hp: 100,
            nickname: player.nickname,
            damage: 0,
            rebirthTime: 0,
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

    public removeBot(bot: Player) {
        this.players.delete(bot);
        bot.roomId = null;
        this._removeActor(bot);
        this._botIdToShootInterval.delete(bot.id);
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
        }, 50);
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
        this._tickBots(dt);
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
            if (player.isBot) {
                return;
            }
            player.connection.send(ApiMsgEnum.MsgServerSync, {
                lastFrameId: this._connectionIdToFrameId.get(player.connection.id),
                inputs: this._pendingInput,
            });
        });

        this._pendingInput.length = 0;
    }

    private _tickBots(dt: number) {
        this.players.forEach(player => {
            if (player.isBot) {
                const botActor = this.state.actors.get(player.id);
                this._tickBot(botActor, dt);
            }
        });
    }

    private _tickBot(botActor: IActor, dt: number) {
        let shootInterval = this._botIdToShootInterval.get(botActor.id);
        shootInterval -= dt;
        this._botIdToShootInterval.set(botActor.id, shootInterval);

        if (botActor.hp <= 0) {
            return;
        }

        const direction = new Vector2(botActor.position.x, botActor.position.y).rotate(((Math.sin(process.uptime()) * Math.E + 1) * Math.PI) / 2).normalize();
        this._pendingInput.push({
            type: InputTypeEnum.ActorMove,
            id: this.id,
            direction: { x: toFixed(direction.x), y: toFixed(direction.y) },
            dt: toFixed(dt),
        });

        if (shootInterval <= 0) {
            const position = new Vector2(botActor.position.x, botActor.position.y + 40).add(direction.clone().scale(100));
            this._pendingInput.push({
                type: InputTypeEnum.WeaponShoot,
                owner: botActor.id,
                position: { x: toFixed(position.x), y: toFixed(position.y) },
                direction: { x: toFixed(direction.x), y: toFixed(direction.y) },
            });

            this._botIdToShootInterval.set(botActor.id, 0.2);
        }
    }
}
