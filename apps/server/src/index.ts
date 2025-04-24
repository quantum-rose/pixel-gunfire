import { PlayerManager } from './Biz/PlayerManager';
import { ApiMsgEnum } from './Common';
import { MyServer } from './Core';
import { symlinkCommon } from './Utils';

symlinkCommon();

const myServer = new MyServer({
    port: 9876,
});

myServer.setApi(ApiMsgEnum.ApiPlayerJoin, (connection, data) => {
    if (!data.nickname) {
        throw new Error('昵称不能为空');
    }

    if (PlayerManager.Instance.getPlayerByConnection(connection.id)) {
        throw new Error('重复登录');
    }

    if (PlayerManager.Instance.getPlayerByNickname(data.nickname)) {
        throw new Error('昵称已存在');
    }

    if (PlayerManager.Instance.isFull) {
        throw new Error('服务器已满');
    }

    const player = PlayerManager.Instance.createPlayer(data.nickname, connection);
    return { player: player.dump() };
});

myServer.setApi(ApiMsgEnum.ApiPlayerList, (_connection, _data) => {
    return { list: PlayerManager.Instance.dumpAllPlayers() };
});

myServer.start();
