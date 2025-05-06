import { Vector2Function } from './Vector2Function';

export class Vector2 extends Array<number> {
    public get x() {
        return this[0];
    }

    public get y() {
        return this[1];
    }

    public set x(v: number) {
        this[0] = v;
    }

    public set y(v: number) {
        this[1] = v;
    }

    constructor(x = 0, y = 0) {
        super(x, y);
        Object.setPrototypeOf(this, Vector2.prototype);
    }

    public set(x: number, y: number) {
        return Vector2Function.set(this, x, y);
    }

    public setX(x: number) {
        this[0] = x;
        return this;
    }

    public setY(y: number) {
        this[1] = y;
        return this;
    }

    public copy(v: number[]) {
        return Vector2Function.copy(this, v);
    }

    public add(v: number[]) {
        return Vector2Function.add(this, this, v);
    }

    public sub(v: number[]) {
        return Vector2Function.sub(this, this, v);
    }

    public dot(v: number[]) {
        return Vector2Function.dot(this, v);
    }

    public cross(v: number[]) {
        return Vector2Function.cross(this, v);
    }

    public scale(s: number) {
        return Vector2Function.scale(this, this, s);
    }

    public multiply(v: number[]) {
        return Vector2Function.multiply(this, this, v);
    }

    public divide(v: number[]) {
        return Vector2Function.divide(this, this, v);
    }

    public negate() {
        return Vector2Function.negate(this, this);
    }

    public invert() {
        return Vector2Function.invert(this, this);
    }

    public normalize() {
        return Vector2Function.normalize(this, this);
    }

    public len() {
        return Vector2Function.len(this);
    }

    public squaredLength() {
        return Vector2Function.squaredLength(this);
    }

    public setLength(length: number) {
        return this.normalize().scale(length);
    }

    public distanceTo(v: number[]) {
        return Vector2Function.distance(this, v);
    }

    public squaredDistanceTo(v: number[]) {
        return Vector2Function.squaredDistance(this, v);
    }

    public angle() {
        return Math.atan2(-this[1], -this[0]) + Math.PI;
    }

    public applyMatrix2(m: number[]) {
        return Vector2Function.transformMatrix2(this, this, m);
    }

    public applyMatrix2D(m: number[]) {
        return Vector2Function.transformMatrix2D(this, this, m);
    }

    public applyMatrix3(m: number[]) {
        return Vector2Function.transformMatrix3(this, this, m);
    }

    public applyMatrix4(m: number[]) {
        return Vector2Function.transformMatrix4(this, this, m);
    }

    public lerp(v: number[], t: number) {
        return Vector2Function.lerp(this, this, v, t);
    }

    public rotate(angle: number, center: number[] = [0, 0]) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const x = this[0] - center[0];
        const y = this[1] - center[1];
        this[0] = x * c - y * s + center[0];
        this[1] = x * s + y * c + center[1];
        return this;
    }

    public equals(v: number[]) {
        return v[0] === this[0] && v[1] === this[1];
    }

    public nearlyEquals(v: number[], tolerance = 1e-6) {
        return Math.abs(this[0] - v[0]) < tolerance && Math.abs(this[1] - v[1]) < tolerance;
    }

    public fromArray(array: number[], offset = 0) {
        this[0] = array[offset];
        this[1] = array[offset + 1];
        return this;
    }

    public toArray(array: number[] = [], offset = 0) {
        array[offset] = this[0];
        array[offset + 1] = this[1];
        return array;
    }

    public random() {
        this[0] = Math.random();
        this[1] = Math.random();
        return this;
    }

    public clone() {
        return new Vector2(this[0], this[1]);
    }
}
