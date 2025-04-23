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

    const { id, nickname, roomId } = PlayerManager.Instance.createPlayer(data.nickname, connection);
    return { player: { id, nickname, roomId } };
});

myServer.setApi(ApiMsgEnum.ApiPlayerList, (_connection, _data) => {
    const allPlayers = PlayerManager.Instance.getAllPlayers();
    const playerList = allPlayers.map(player => ({
        id: player.id,
        nickname: player.nickname,
        roomId: player.roomId,
    }));
    return { list: playerList };
});

myServer.start();
