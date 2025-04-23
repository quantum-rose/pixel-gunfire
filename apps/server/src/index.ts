import { WebSocket, WebSocketServer } from 'ws';
import { ApiMsgEnum, IInput } from './Common';
import { symlinkCommon } from './Utils';

symlinkCommon();

const wss = new WebSocketServer({
    port: 9876,
});

const inputs: IInput[] = [];
const clients: WebSocket[] = [];

wss.on('connection', socket => {
    clients.push(socket);
    console.log(`Client connected, total clients: ${clients.length}`);

    socket.on('message', message => {
        const json = JSON.parse(message.toString());
        const {
            name,
            data: { frameId, input },
        } = json;
        inputs.push(input);
    });

    socket.on('close', () => {
        const index = clients.indexOf(socket);
        if (index !== -1) {
            clients.splice(index, 1);
        }
        console.log(`Client disconnected, remaining clients: ${clients.length}`);
    });
});

setInterval(() => {
    if (inputs.length > 0) {
        const sendMsg = JSON.stringify({
            name: ApiMsgEnum.MsgServerSync,
            data: {
                inputs,
            },
        });
        inputs.length = 0;
        for (const client of clients) {
            client.send(sendMsg);
        }
    }
}, 0);

wss.on('listening', () => {
    console.log('WebSocket server is listening on ws://localhost:9876');
});
