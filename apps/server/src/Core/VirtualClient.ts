import { WebSocket } from 'ws';
import {
    ApiMsgEnum,
    binaryDecode,
    binaryEncode,
    IClientInput,
    IModel,
    IMsgClientSync,
    IMsgRoom,
    IMsgServerSync,
    InputTypeEnum,
    IPlayer,
    IRoom,
    State,
    toFixed,
} from '../Common';
import { Vector2 } from '../Common/Vector2';

interface IItem {
    cb: Function;
    ctx: unknown;
}

interface ICallApiResult<T> {
    success: boolean;
    res?: T;
    error?: string;
}

export class VirtualClient {
    private _ws: WebSocket;

    private _map: Map<ApiMsgEnum, IItem[]> = new Map();

    private _connecting: Promise<void> = null;

    private _lastState = new State();

    private _state = new State();

    private _playerInfo: IPlayer = null;

    private _roomInfo: IRoom = null;

    private _frameId = 1;

    private _pendingMsg: IMsgClientSync[] = [];

    private _shootInterval = 0;

    public async startup() {
        await this._connect();
        await this._login();
        await this._createRoom();
        this._startGame();
    }

    /**
     * 模拟网络延迟
     */
    private _delay() {
        return new Promise(resolve => {
            setTimeout(resolve, 50);
        });
    }

    private _connect() {
        if (this._connecting === null) {
            this._connecting = new Promise<void>((resolve, reject) => {
                this._ws = new WebSocket('ws://localhost:9876', {});
                this._ws.binaryType = 'arraybuffer';

                this._ws.onopen = () => {
                    this._connecting = null;
                    resolve();
                    console.log('WebSocket connection opened');
                };

                this._ws.onerror = error => {
                    this._connecting = null;
                    this._ws = null;
                    reject(error);
                };

                this._ws.onmessage = async event => {
                    await this._delay();

                    const message = binaryDecode(event.data as ArrayBuffer);
                    const { name, data } = message;
                    if (this._map.has(name)) {
                        this._map.get(name).forEach(({ cb, ctx }) => {
                            cb.call(ctx, data);
                        });
                    }
                };

                this._ws.onclose = event => {
                    this._connecting = null;
                    this._ws = null;

                    console.log('WebSocket connection closed', event.code, event.reason);
                };
            });
        }

        return this._connecting;
    }

    private _callApi<T extends keyof IModel['api']>(name: T, data: IModel['api'][T]['req']): Promise<ICallApiResult<IModel['api'][T]['res']>> {
        return new Promise((resolve, reject) => {
            const cb = data => {
                clearTimeout(timer);
                this._unlisten(name as any, cb, null);
                resolve(data);
            };

            this._listen(name as any, cb, null);

            const timer = setTimeout(() => {
                this._unlisten(name as any, cb, null);
                reject(new Error(`API call timed out for ${name}`));
            }, 5000);

            this._send(name as any, data);
        });
    }

    private async _send<T extends keyof IModel['msg']>(name: T, data: IModel['msg'][T]) {
        await this._delay();

        this._ws.send(binaryEncode(name, data));
    }

    private _listen<T extends keyof IModel['msg']>(name: T, cb: (args: IModel['msg'][T]) => void, ctx: unknown) {
        if (this._map.has(name)) {
            this._map.get(name).push({ cb, ctx });
        } else {
            this._map.set(name, [{ cb, ctx }]);
        }
    }

    private _unlisten<T extends keyof IModel['msg']>(name: T, cb: (args: IModel['msg'][T]) => void, ctx: unknown) {
        if (this._map.has(name)) {
            const list = this._map.get(name);
            const index = list.findIndex(item => item.cb === cb && item.ctx === ctx);
            if (index !== -1) {
                list.splice(index, 1);
            }
        }
    }

    private async _login() {
        const { res } = await this._callApi(ApiMsgEnum.ApiPlayerJoin, { nickname: 'Bot' });
        this._playerInfo = res.player;
    }

    private async _createRoom() {
        const { res } = await this._callApi(ApiMsgEnum.ApiRoomCreate, { name: '' });
        this._syncRoom(res);
    }

    private _syncRoom(data: IMsgRoom) {
        this._roomInfo = data.room;
        this._state.load(data.state);
        this._lastState.load(data.state);
    }

    private _startGame() {
        this._listen(ApiMsgEnum.MsgRoom, this._onRoomSync, this);
        this._listen(ApiMsgEnum.MsgServerSync, this._onServerSync, this);

        let lastTime = Date.now();
        setInterval(() => {
            const now = Date.now();
            const dt = (now - lastTime) / 1000;
            lastTime = now;

            this._update(dt);
        }, 16);
    }

    private _onRoomSync(data: IMsgRoom) {
        this._syncRoom(data);
    }

    private async _onServerSync(data: IMsgServerSync) {
        this._state.load(this._lastState.dump());

        for (const input of data.inputs) {
            this._state.applyInput(input);
        }

        this._lastState.load(this._state.dump());

        this._pendingMsg = this._pendingMsg.reduce((acc, msg) => {
            if (msg.frameId > data.lastFrameId) {
                this._state.applyInput(msg.input);
                acc.push(msg);
            }
            return acc;
        }, []);
    }

    private _onClientSync(input: IClientInput) {
        const data: IMsgClientSync = {
            input,
            frameId: this._frameId++,
        };
        this._send(ApiMsgEnum.MsgClientSync, data);

        if (input.type === InputTypeEnum.ActorMove) {
            this._state.applyInput(input);
            this._pendingMsg.push(data);
        }
    }

    private _update(dt: number) {
        const myActor = this._state.actors.get(this._playerInfo.id);
        if (myActor.hp <= 0) {
            return;
        }

        let direction: Vector2 = null;

        if (this._state.actors.size < 2) {
            return;
        }

        const otherAliveActors = Array.from(this._state.actors.values()).filter(actor => actor.id !== myActor.id && actor.hp > 0);

        if (otherAliveActors.length === 0 || myActor.hp > 50) {
            direction = new Vector2(myActor.position.x, myActor.position.y).rotate(((Math.sin(process.uptime() * 0.5) * Math.E + 1) * Math.PI) / 2).normalize();
        } else {
            otherAliveActors.sort((a, b) => a.hp - b.hp);
            const targetActor = otherAliveActors[0];
            direction = new Vector2(targetActor.position.x - myActor.position.x, targetActor.position.y - myActor.position.y).normalize();
        }

        this._shootInterval -= dt;
        if (this._shootInterval <= 0) {
            this._shootInterval = 0.1;

            const position = new Vector2(myActor.position.x, myActor.position.y + 40).add(direction.clone().scale(100));
            this._onClientSync({
                type: InputTypeEnum.WeaponShoot,
                owner: myActor.id,
                position: { x: toFixed(position.x), y: toFixed(position.y) },
                direction: { x: toFixed(direction.x), y: toFixed(direction.y) },
            });
        }

        this._onClientSync({
            type: InputTypeEnum.ActorMove,
            id: myActor.id,
            direction: { x: toFixed(direction.x), y: toFixed(direction.y) },
            dt: toFixed(dt),
        });
    }
}
