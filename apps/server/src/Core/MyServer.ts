import { ApiMsgEnum, IModel } from '@pixel-gunfire/common';
import { WebSocketServer } from 'ws';
import { Connection } from './Connection';

export class MyServer {
    private _port: number;

    private _wss: WebSocketServer;

    private _connections = new Set<Connection>();

    private _apiMap = new Map<ApiMsgEnum, Function>();

    constructor({ port }: { port: number }) {
        this._port = port;
    }

    public start() {
        return new Promise<void>((resolve, reject) => {
            this._wss = new WebSocketServer({ port: this._port });

            this._wss.on('listening', () => {
                console.log(`WebSocket server is listening on ws://localhost:${this._port}`);
                resolve();
            });

            this._wss.on('error', error => {
                console.error('WebSocket server error:', error);
                reject(error);
            });

            this._wss.on('connection', socket => {
                const connection = new Connection(this, socket);
                this._connections.add(connection);
                console.log('Client connected, total clients:', this._connections.size);
            });

            this._wss.on('close', () => {
                console.log('WebSocket server closed');
            });
        });
    }

    public removeConnection(connection: Connection) {
        this._connections.delete(connection);
        console.log('Client disconnected, remaining clients:', this._connections.size);
    }

    public setApi<T extends keyof IModel['api']>(name: T, cb: (connection: Connection, data: IModel['api'][T]['req']) => IModel['api'][T]['res']) {
        this._apiMap.set(name, cb);
    }

    public hasApi<T extends keyof IModel['api']>(name: T) {
        return this._apiMap.has(name);
    }

    public callApi<T extends keyof IModel['api']>(name: T, connection: Connection, data: IModel['api'][T]['req']) {
        const cb = this._apiMap.get(name);
        if (!cb) {
            console.error(`API ${name} not found`);
            return;
        }

        return cb.call(null, connection, data);
    }
}
