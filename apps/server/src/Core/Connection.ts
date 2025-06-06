import { WebSocket } from 'ws';
import { PlayerManager } from '../Biz/PlayerManager';
import { RoomManager } from '../Biz/RoomManager';
import { ApiMsgEnum, binaryDecode, binaryEncode, IModel } from '../Common';
import { bufferToArrayBuffer } from '../Utils';
import type { MyServer } from './MyServer';

interface IItem {
    cb: Function;
    ctx: unknown;
}

export class Connection {
    private static _nextId: number = 1;

    public id: number;

    private _server: MyServer;

    private _ws: WebSocket;

    private _msgMap: Map<ApiMsgEnum, IItem[]> = new Map();

    constructor(server: MyServer, ws: WebSocket) {
        this.id = Connection._nextId++;
        this._server = server;
        this._ws = ws;

        this._ws.on('message', this._onMessage);
        this._ws.on('close', this._onClose);
    }

    private _onMessage = (rawData: Buffer) => {
        const message = binaryDecode(bufferToArrayBuffer(rawData));
        const { name, data } = message;

        if (this._server.hasApi(name)) {
            try {
                const res = this._server.callApi(name, this, data);
                this.send(name, {
                    success: true,
                    res,
                });
            } catch (error) {
                this.send(name, {
                    success: false,
                    error: error.message,
                });
            }
        } else if (this._msgMap.has(name)) {
            this._msgMap.get(name).forEach(({ cb, ctx }) => {
                cb.call(ctx, this, data);
            });
        }
    };

    private _onClose = () => {
        const player = PlayerManager.Instance.getPlayerByConnection(this.id);
        if (player) {
            if (player.roomId) {
                const roomId = player.roomId;
                RoomManager.Instance.leaveRoom(player);
                RoomManager.Instance.syncRooms();
                RoomManager.Instance.syncRoom(roomId);
            }

            PlayerManager.Instance.removePlayer(player);
            PlayerManager.Instance.syncPlayers();
        }

        this._server.removeConnection(this);
    };

    public send<T extends keyof IModel['msg']>(name: T, data: IModel['msg'][T]): void {
        this._ws.send(binaryEncode(name, data));
    }

    public listen<T extends keyof IModel['msg']>(name: T, cb: (connection: Connection, args: IModel['msg'][T]) => void, ctx: unknown) {
        if (this._msgMap.has(name)) {
            this._msgMap.get(name).push({ cb, ctx });
        } else {
            this._msgMap.set(name, [{ cb, ctx }]);
        }
    }

    public unlisten<T extends keyof IModel['msg']>(name: T, cb: (connection: Connection, args: IModel['msg'][T]) => void, ctx: unknown) {
        if (this._msgMap.has(name)) {
            const list = this._msgMap.get(name);
            const index = list.findIndex(item => item.cb === cb && item.ctx === ctx);
            if (index !== -1) {
                list.splice(index, 1);
            }
        }
    }
}
