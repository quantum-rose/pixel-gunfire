import { PlayerManager } from './Biz/PlayerManager';
import { RoomManager } from './Biz/RoomManager';
import { ApiMsgEnum } from './Common';
import { MyServer } from './Core';
import { symlinkCommon } from './Utils';

if (process.env.NODE_ENV === 'development') {
    symlinkCommon();
}

const myServer = new MyServer({
    port: 9876,
});

/**
 * 登录
 */
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

/**
 * 获取玩家列表
 */
myServer.setApi(ApiMsgEnum.ApiPlayerList, (_connection, _data) => {
    return { list: PlayerManager.Instance.dumpAllPlayers() };
});

/**
 * 获取房间列表
 */
myServer.setApi(ApiMsgEnum.ApiRoomList, (_connection, _data) => {
    return { list: RoomManager.Instance.dumpAllRooms() };
});

/**
 * 创建房间
 */
myServer.setApi(ApiMsgEnum.ApiRoomCreate, (connection, data) => {
    const player = PlayerManager.Instance.getPlayerByConnection(connection.id);
    if (!player) {
        throw new Error('未登录');
    }

    if (player.roomId) {
        throw new Error('玩家已在房间内');
    }

    if (RoomManager.Instance.isFull) {
        throw new Error('房间数量已达上限');
    }

    const room = RoomManager.Instance.createRoom(player);

    RoomManager.Instance.joinRoom(player, room);

    RoomManager.Instance.syncRooms();
    RoomManager.Instance.syncRoom(room.id);
    PlayerManager.Instance.syncPlayers();

    return { room: room.dump() };
});

/**
 * 加入房间
 */
myServer.setApi(ApiMsgEnum.ApiRoomJoin, (connection, data) => {
    const player = PlayerManager.Instance.getPlayerByConnection(connection.id);
    if (!player) {
        throw new Error('未登录');
    }

    if (player.roomId) {
        throw new Error('玩家已在房间内');
    }

    const room = RoomManager.Instance.getRoom(data.roomId);
    if (!room) {
        throw new Error('房间不存在');
    }

    if (room.isFull) {
        throw new Error('房间已满');
    }

    RoomManager.Instance.joinRoom(player, room);

    RoomManager.Instance.syncRooms();
    RoomManager.Instance.syncRoom(room.id);
    PlayerManager.Instance.syncPlayers();

    return { room: room.dump() };
});

/**
 * 离开房间
 */
myServer.setApi(ApiMsgEnum.ApiRoomLeave, (connection, _data) => {
    const player = PlayerManager.Instance.getPlayerByConnection(connection.id);
    if (!player) {
        throw new Error('未登录');
    }

    if (!player.roomId) {
        throw new Error('玩家不在房间内');
    }

    const roomId = player.roomId;

    RoomManager.Instance.leaveRoom(player);

    RoomManager.Instance.syncRooms();
    RoomManager.Instance.syncRoom(roomId);
    PlayerManager.Instance.syncPlayers();

    return {};
});

/**
 * 开始游戏
 */
myServer.setApi(ApiMsgEnum.ApiGameStart, (connection, _data) => {
    const player = PlayerManager.Instance.getPlayerByConnection(connection.id);
    if (!player) {
        throw new Error('未登录');
    }

    if (!player.roomId) {
        throw new Error('玩家不在房间内');
    }

    const room = RoomManager.Instance.getRoom(player.roomId);
    if (room.owner.id !== player.id) {
        throw new Error('只有房主可以开始游戏');
    }

    if (room.players.size < 2) {
        throw new Error('至少需要两名玩家才能开始游戏');
    }

    RoomManager.Instance.startRoom(room);

    RoomManager.Instance.syncRooms();
    RoomManager.Instance.syncRoom(room.id);
    PlayerManager.Instance.syncPlayers();

    return {};
});

myServer.start();
