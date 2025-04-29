import { ApiMsgEnum, InputTypeEnum } from './Enum';
import { IModel } from './Model';
import { IActorMove, IClientInput, ITimePast, IWeaponShoot } from './State';
import { strdecode, strencode } from './Util';

const MSG_NAME_SIZE = 1;
const FRAME_ID_SIZE = 4;
const ACTOR_MOVE_SIZE = 17;
const WEAPON_SHOOT_SIZE = 21;
const TIME_PAST_SIZE = 5;

function setFloat(dv: DataView, index: number, value: number) {
    dv.setInt32(index, value * 1000);
}

function getFloat(dv: DataView, index: number) {
    return dv.getInt32(index) / 1000;
}

function encodeActorMove(input: IActorMove, dv: DataView, index: number) {
    dv.setUint8(index++, input.type);
    dv.setUint32(index, input.id);
    index += 4;
    setFloat(dv, index, input.direction.x);
    index += 4;
    setFloat(dv, index, input.direction.y);
    index += 4;
    setFloat(dv, index, input.dt);
}

function encodeWeaponShoot(input: IWeaponShoot, dv: DataView, index: number) {
    dv.setUint8(index++, input.type);
    dv.setUint32(index, input.owner);
    index += 4;
    setFloat(dv, index, input.position.x);
    index += 4;
    setFloat(dv, index, input.position.y);
    index += 4;
    setFloat(dv, index, input.direction.x);
    index += 4;
    setFloat(dv, index, input.direction.y);
}

function encodeTimePast(input: ITimePast, dv: DataView, index: number) {
    dv.setUint8(index++, input.type);
    setFloat(dv, index, input.dt);
}

export function binaryEncode<T extends keyof IModel['msg']>(name: T, data: IModel['msg'][T]): ArrayBuffer {
    if (name === ApiMsgEnum.MsgClientSync) {
        const { frameId, input } = data as IModel['msg'][ApiMsgEnum.MsgClientSync];

        switch (input.type) {
            case InputTypeEnum.ActorMove: {
                let index = 0;
                const ab = new ArrayBuffer(MSG_NAME_SIZE + FRAME_ID_SIZE + ACTOR_MOVE_SIZE);
                const dv = new DataView(ab);
                dv.setUint8(index++, name);
                dv.setUint32(index, frameId);
                index += 4;
                encodeActorMove(input, dv, index);
                return ab;
            }
            case InputTypeEnum.WeaponShoot: {
                let index = 0;
                const ab = new ArrayBuffer(MSG_NAME_SIZE + FRAME_ID_SIZE + WEAPON_SHOOT_SIZE);
                const dv = new DataView(ab);
                dv.setUint8(index++, name);
                dv.setUint32(index, frameId);
                index += 4;
                encodeWeaponShoot(input, dv, index);
                return ab;
            }
            case InputTypeEnum.TimePast: {
                let index = 0;
                const ab = new ArrayBuffer(MSG_NAME_SIZE + FRAME_ID_SIZE + TIME_PAST_SIZE);
                const dv = new DataView(ab);
                dv.setUint8(index++, name);
                dv.setUint32(index, frameId);
                index += 4;
                encodeTimePast(input, dv, index);
                return ab;
            }
        }
    } else if (name === ApiMsgEnum.MsgServerSync) {
        const { lastFrameId, inputs } = data as IModel['msg'][ApiMsgEnum.MsgServerSync];

        let length = MSG_NAME_SIZE + FRAME_ID_SIZE;
        for (const input of inputs) {
            switch (input.type) {
                case InputTypeEnum.ActorMove:
                    length += ACTOR_MOVE_SIZE;
                    break;
                case InputTypeEnum.WeaponShoot:
                    length += WEAPON_SHOOT_SIZE;
                    break;
                case InputTypeEnum.TimePast:
                    length += TIME_PAST_SIZE;
                    break;
            }
        }

        const ab = new ArrayBuffer(length);
        const dv = new DataView(ab);
        let index = 0;
        dv.setUint8(index++, name);
        dv.setUint32(index, lastFrameId);
        index += 4;

        for (const input of inputs) {
            switch (input.type) {
                case InputTypeEnum.ActorMove:
                    encodeActorMove(input, dv, index);
                    index += ACTOR_MOVE_SIZE;
                    break;
                case InputTypeEnum.WeaponShoot:
                    encodeWeaponShoot(input, dv, index);
                    index += WEAPON_SHOOT_SIZE;
                    break;
                case InputTypeEnum.TimePast:
                    encodeTimePast(input, dv, index);
                    index += TIME_PAST_SIZE;
                    break;
            }
        }
        return ab;
    } else {
        const str = JSON.stringify(data);
        const ta = strencode(str);
        const ab = new ArrayBuffer(ta.length + MSG_NAME_SIZE);
        const dv = new DataView(ab);
        let index = 0;
        dv.setUint8(index++, name);
        for (let i = 0; i < ta.length; i++) {
            dv.setUint8(index++, ta[i]);
        }
        return ab;
    }
}

function decodeActorMove(dv: DataView, index: number): IActorMove {
    const input: IActorMove = {
        type: InputTypeEnum.ActorMove,
        id: dv.getUint32(index),
        direction: {
            x: getFloat(dv, (index += 4)),
            y: getFloat(dv, (index += 4)),
        },
        dt: getFloat(dv, (index += 4)),
    };
    return input;
}

function decodeWeaponShoot(dv: DataView, index: number): IWeaponShoot {
    const input: IWeaponShoot = {
        type: InputTypeEnum.WeaponShoot,
        owner: dv.getUint32(index),
        position: {
            x: getFloat(dv, (index += 4)),
            y: getFloat(dv, (index += 4)),
        },
        direction: {
            x: getFloat(dv, (index += 4)),
            y: getFloat(dv, (index += 4)),
        },
    };
    return input;
}

function decodeTimePast(dv: DataView, index: number): ITimePast {
    const input: ITimePast = {
        type: InputTypeEnum.TimePast,
        dt: getFloat(dv, index),
    };
    return input;
}

export function binaryDecode(buffer: ArrayBuffer) {
    const dv = new DataView(buffer);

    let index = 0;
    const name = dv.getUint8(index++);
    if (name === ApiMsgEnum.MsgClientSync) {
        const frameId = dv.getUint32(index);
        index += 4;

        let input: IClientInput;
        const inputType = dv.getUint8(index++);
        switch (inputType) {
            case InputTypeEnum.ActorMove:
                input = decodeActorMove(dv, index);
                break;
            case InputTypeEnum.WeaponShoot:
                input = decodeWeaponShoot(dv, index);
                break;
            case InputTypeEnum.TimePast:
                input = decodeTimePast(dv, index);
                break;
        }

        return { name, data: { frameId, input } };
    } else if (name === ApiMsgEnum.MsgServerSync) {
        const lastFrameId = dv.getUint32(index);
        index += 4;

        const inputs: IClientInput[] = [];
        while (index < dv.byteLength) {
            let input: IClientInput;
            const inputType = dv.getUint8(index++);
            switch (inputType) {
                case InputTypeEnum.ActorMove:
                    input = decodeActorMove(dv, index);
                    index += ACTOR_MOVE_SIZE - 1;
                    break;
                case InputTypeEnum.WeaponShoot:
                    input = decodeWeaponShoot(dv, index);
                    index += WEAPON_SHOOT_SIZE - 1;
                    break;
                case InputTypeEnum.TimePast:
                    input = decodeTimePast(dv, index);
                    index += TIME_PAST_SIZE - 1;
                    break;
            }
            inputs.push(input);
        }

        return { name, data: { lastFrameId, inputs } };
    } else {
        const ta = new Uint8Array(buffer.slice(1));
        const str = strdecode(ta);
        const data = JSON.parse(str);
        return { name, data };
    }
}
