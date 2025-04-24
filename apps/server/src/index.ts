import { PlayerManager } from './Biz/PlayerManager';
import { RoomManager } from './Biz/RoomManager';
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

    PlayerManager.Instance.syncPlayers();

    return { player: player.dump() };
});

myServer.setApi(ApiMsgEnum.ApiPlayerList, (_connection, _data) => {
    return { list: PlayerManager.Instance.dumpAllPlayers() };
});

myServer.setApi(ApiMsgEnum.ApiRoomCreate, (connection, data) => {
    const player = PlayerManager.Instance.getPlayerByConnection(connection.id);
    if (!player) {
        throw new Error('未登录');
    }

    if (player.roomId) {
        throw new Error('玩家已在房间内');
    }

    const room = RoomManager.Instance.createRoom(data.name);

    RoomManager.Instance.joinRoom(player, room);
    RoomManager.Instance.syncRooms();
    PlayerManager.Instance.syncPlayers();

    return { room: room.dump() };
});

myServer.setApi(ApiMsgEnum.ApiRoomList, (_connection, _data) => {
    return { list: RoomManager.Instance.dumpAllRooms() };
});

myServer.start();
