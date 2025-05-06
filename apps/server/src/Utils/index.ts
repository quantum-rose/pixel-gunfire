export function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
    const ab = new ArrayBuffer(buffer.length);
    const dv = new DataView(ab);
    for (let i = 0; i < buffer.length; i++) {
        dv.setUint8(i, buffer[i]);
    }
    return ab;
}
