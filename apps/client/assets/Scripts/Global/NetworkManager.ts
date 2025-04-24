import Singleton from '../Base/Singleton';
import { ApiMsgEnum } from '../Common';
import { IModel } from '../Common/Model';

interface IItem {
    cb: Function;
    ctx: unknown;
}

interface ICallApiResult<T> {
    success: boolean;
    res?: T;
    error?: string;
}

export class NetworkManager extends Singleton {
    static get Instance() {
        return super.GetInstance<NetworkManager>();
    }

    private _ws: WebSocket;

    private _map: Map<ApiMsgEnum, IItem[]> = new Map();

    public get isConnected() {
        return this._ws && this._ws.readyState === WebSocket.OPEN;
    }

    private _connecting: Promise<void> = null;

    public connect() {
        if (this.isConnected) {
            return Promise.resolve();
        }

        if (this._connecting === null) {
            this._connecting = new Promise<void>((resolve, reject) => {
                this._ws = new WebSocket('ws://192.168.10.171:9876');

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

                this._ws.onmessage = event => {
                    const message = JSON.parse(event.data);
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

    public callApi<T extends keyof IModel['api']>(name: T, data: IModel['api'][T]['req']): Promise<ICallApiResult<IModel['api'][T]['res']>> {
        return new Promise((resolve, reject) => {
            const cb = data => {
                clearTimeout(timer);
                this.unlisten(name as any, cb, null);
                resolve(data);
            };

            this.listen(name as any, cb, null);

            const timer = setTimeout(() => {
                this.unlisten(name as any, cb, null);
                reject(new Error(`API call timed out for ${name}`));
            }, 5000);

            this.send(name as any, data);
        });
    }

    public send<T extends keyof IModel['msg']>(name: T, data: IModel['msg'][T]) {
        const message = JSON.stringify({
            name,
            data,
        });
        this._ws.send(message);
    }

    public listen<T extends keyof IModel['msg']>(name: T, cb: (args: IModel['msg'][T]) => void, ctx: unknown) {
        if (this._map.has(name)) {
            this._map.get(name).push({ cb, ctx });
        } else {
            this._map.set(name, [{ cb, ctx }]);
        }
    }

    public unlisten<T extends keyof IModel['msg']>(name: T, cb: (args: IModel['msg'][T]) => void, ctx: unknown) {
        if (this._map.has(name)) {
            const list = this._map.get(name);
            const index = list.findIndex(item => item.cb === cb && item.ctx === ctx);
            if (index !== -1) {
                list.splice(index, 1);
            }
        }
    }
}
