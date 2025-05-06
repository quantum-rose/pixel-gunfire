export class Vector2Function {
    public static set<T extends Array<number>>(out: T, x: number, y: number) {
        out[0] = x;
        out[1] = y;
        return out;
    }

    public static copy<T extends Array<number>>(out: T, a: number[]) {
        out[0] = a[0];
        out[1] = a[1];
        return out;
    }

    public static add<T extends Array<number>>(out: T, a: number[], b: number[]) {
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        return out;
    }

    public static sub<T extends Array<number>>(out: T, a: number[], b: number[]) {
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        return out;
    }

    public static dot(a: number[], b: number[]) {
        return a[0] * b[0] + a[1] * b[1];
    }

    public static cross(a: number[], b: number[]) {
        return a[0] * b[1] - a[1] * b[0];
    }

    public static scale<T extends Array<number>>(out: T, a: number[], s: number) {
        out[0] = a[0] * s;
        out[1] = a[1] * s;
        return out;
    }

    public static multiply<T extends Array<number>>(out: T, a: number[], b: number[]) {
        out[0] = a[0] * b[0];
        out[1] = a[1] * b[1];
        return out;
    }

    public static divide<T extends Array<number>>(out: T, a: number[], b: number[]) {
        out[0] = a[0] / b[0];
        out[1] = a[1] / b[1];
        return out;
    }

    public static negate<T extends Array<number>>(out: T, a: number[]) {
        out[0] = -a[0];
        out[1] = -a[1];
        return out;
    }

    public static invert<T extends Array<number>>(out: T, a: number[]) {
        out[0] = 1.0 / a[0];
        out[1] = 1.0 / a[1];
        return out;
    }

    public static normalize<T extends Array<number>>(out: T, a: number[]) {
        const [x, y] = a;
        var len = x * x + y * y;
        if (len > 0) {
            len = 1 / Math.sqrt(len);
            out[0] = a[0] * len;
            out[1] = a[1] * len;
        } else {
            out[0] = 0;
            out[1] = 0;
        }
        return out;
    }

    public static len(a: number[]) {
        return Math.hypot(a[0], a[1]);
    }

    public static squaredLength(a: number[]) {
        const [x, y] = a;
        return x * x + y * y;
    }

    public static distance(a: number[], b: number[]) {
        return Math.hypot(b[0] - a[0], b[1] - a[1]);
    }

    public static squaredDistance(a: number[], b: number[]) {
        const x = b[0] - a[0];
        const y = b[1] - a[1];
        return x * x + y * y;
    }

    public static transformMatrix2<T extends Array<number>>(out: T, a: number[], m: number[]) {
        const [x, y] = a;
        out[0] = m[0] * x + m[2] * y;
        out[1] = m[1] * x + m[3] * y;
        return out;
    }

    public static transformMatrix2D<T extends Array<number>>(out: T, a: number[], m: number[]) {
        const [x, y] = a;
        out[0] = m[0] * x + m[2] * y + m[4];
        out[1] = m[1] * x + m[3] * y + m[5];
        return out;
    }

    public static transformMatrix3<T extends Array<number>>(out: T, a: number[], m: number[]) {
        const [x, y] = a;
        out[0] = m[0] * x + m[3] * y + m[6];
        out[1] = m[1] * x + m[4] * y + m[7];
        return out;
    }

    public static transformMatrix4<T extends Array<number>>(out: T, a: number[], m: number[]) {
        const [x, y] = a;
        out[0] = m[0] * x + m[4] * y + m[12];
        out[1] = m[1] * x + m[5] * y + m[13];
        return out;
    }

    public static lerp<T extends Array<number>>(out: T, a: number[], b: number[], t: number) {
        const [ax, ay] = a;
        out[0] = ax + t * (b[0] - ax);
        out[1] = ay + t * (b[1] - ay);
        return out;
    }
}
