export function toFixed(value: number, n: number = 3) {
    return Math.round(value * Math.pow(10, n)) / Math.pow(10, n);
}
