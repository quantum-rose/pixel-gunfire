import Singleton from '../Base/Singleton';

interface IItem {
    cb: Function;
    ctx: unknown;
}

export class NetworkManager extends Singleton {
    static get Instance() {
        return super.GetInstance<NetworkManager>();
    }

    public ws: WebSocket;

    private _map: Map<string, Array<IItem>> = new Map();

    public connect() {
        return new Promise<void>((resolve, reject) => {
            const ws = new WebSocket('ws://localhost:9876');
            this.ws = ws;
            ws.onopen = () => {
                resolve();
                console.log('WebSocket connection opened');
            };
            ws.onmessage = event => {
                const json = JSON.parse(event.data);
                const { name, data } = json;
                if (this._map.has(name)) {
                    this._map.get(name).forEach(({ cb, ctx }) => {
                        cb.call(ctx, data);
                    });
                }
            };
            ws.onclose = event => {
                console.log('WebSocket connection closed', event.code, event.reason);
                reject();
            };
            ws.onerror = error => {
                reject(error);
            };
        });
    }

    public send(name: string, data: any) {
        const sendMsg = {
            name,
            data,
        };
        this.ws.send(JSON.stringify(sendMsg));
    }

    public listen(name: string, cb: Function, ctx: unknown) {
        if (this._map.has(name)) {
            this._map.get(name).push({ cb, ctx });
        } else {
            this._map.set(name, [{ cb, ctx }]);
        }
    }

    public unlisten(name: string, cb: Function, ctx: unknown) {
        if (this._map.has(name)) {
            const list = this._map.get(name);
            const index = list.findIndex(item => item.cb === cb && item.ctx === ctx);
            if (index !== -1) {
                list.splice(index, 1);
            }
        }
    }
}
