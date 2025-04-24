import Singleton from '../Base/Singleton';
import { ApiMsgEnum, IRoom } from '../Common';
import type { Player } from './Player';
import { PlayerManager } from './PlayerManager';
import { Room } from './Room';

export class RoomManager extends Singleton {
    static get Instance() {
        return super.GetInstance<RoomManager>();
    }

    private _id2Room: Map<number, Room> = new Map();
    private _name2Room: Map<string, Room> = new Map();

    public get isFull() {
        return this._id2Room.size >= 25;
    }

    public createRoom(owner: Player) {
        const room = new Room(owner);
        this._id2Room.set(room.id, room);
        this._name2Room.set(room.name, room);

        console.log(`Room created: ${room.id}, ${room.name}, Total: ${this._id2Room.size}`);

        return room;
    }

    public removeRoom(room: Room) {
        this._id2Room.delete(room.id);
        this._name2Room.delete(room.name);

        console.log(`Room removed: ${room.id}, ${room.name}, Remaining: ${this._id2Room.size}`);
    }

    public syncRooms() {
        const roomList = this.dumpAllRooms();
        PlayerManager.Instance.getAllPlayers().forEach(player => {
            player.connection.send(ApiMsgEnum.MsgRoomList, {
                list: roomList,
            });
        });
    }

    public syncRoom(roomId: number) {
        const room = this._id2Room.get(roomId);
        if (!room) {
            return;
        }

        room.players.forEach(player => {
            player.connection.send(ApiMsgEnum.MsgRoom, {
                room: room.dump(),
            });
        });
    }

    public getRoom(id: number) {
        return this._id2Room.get(id);
    }

    public getRoomByName(name: string) {
        return this._name2Room.get(name);
    }

    public getAllRooms() {
        return Array.from(this._id2Room.values());
    }

    public dumpAllRooms() {
        const rooms: IRoom[] = [];
        this._id2Room.forEach(room => {
            rooms.push(room.dump());
        });
        return rooms;
    }

    public joinRoom(player: Player, room: Room) {
        this.leaveRoom(player);

        room.addPlayer(player);

        console.log(`Player joined room: ${player.id}, ${player.nickname}, Room: ${room.id}, ${room.name}`);
    }

    public leaveRoom(player: Player) {
        if (!player.roomId) {
            return;
        }

        const room = this._id2Room.get(player.roomId);
        room.removePlayer(player);

        console.log(`Player left room: ${player.id}, ${player.nickname}, Room: ${room.id}, ${room.name}`);

        if (room.isEmpty) {
            this.removeRoom(room);
        }
    }
}
