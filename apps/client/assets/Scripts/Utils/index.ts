import { SpriteFrame } from 'cc';

const INDEX_REG = /\((\d+)\)/;

const getNumberWithinString = (str: string) => parseInt(str.match(INDEX_REG)?.[1] || '0');

export const sortSpriteFrame = (spriteFrame: SpriteFrame[]) => spriteFrame.sort((a, b) => getNumberWithinString(a.name) - getNumberWithinString(b.name));

/**
 * 弧度转角度
 */
export const radianToAngle = (radian: number) => (radian * 180) / Math.PI;
