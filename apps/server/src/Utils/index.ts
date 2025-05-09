import fs from 'fs-extra';
import path from 'path';

//symlink同步
export const symlinkCommon = async () => {
    const src = path.resolve(__dirname, '../Common');
    const dst = path.resolve(__dirname, '../../../client/assets/Scripts/Common');

    if (
        (await fs
            .lstat(dst)
            .then(v => v.isSymbolicLink())
            .catch(() => false)) &&
        (await fs.readlink(dst)) === src
    ) {
        console.log('同步成功！');
    } else {
        fs.symlink(src, dst)
            .then(() => {
                console.log('同步成功！');
            })
            .catch(e => {
                console.log('同步失败！', e);
            });
    }
};

export function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
    const ab = new ArrayBuffer(buffer.length);
    const dv = new DataView(ab);
    for (let i = 0; i < buffer.length; i++) {
        dv.setUint8(i, buffer[i]);
    }
    return ab;
}
