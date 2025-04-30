import { resources, SpriteFrame } from 'cc';
import { TexturePathEnum } from '../Enum';

export class TextureManager {
    private static _resources = new Map<string, SpriteFrame[]>();

    private static _progressMap = new Map<string, number>();

    public static registerTexture(path: string) {
        if (!TextureManager._resources.has(path)) {
            TextureManager._resources.set(path, []);
        }
    }

    public static async loadTextures(onProgress: (progress: number) => void): Promise<void> {
        const onProgressWrap = (path: string) => (finished: number, total: number) => {
            TextureManager._progressMap.set(path, finished / total);
            let totalProgress = 0;
            for (let [, progress] of TextureManager._progressMap) {
                totalProgress += progress;
            }
            onProgress(totalProgress / TextureManager._resources.size);
        };

        const onCompleteWrap = (path: string, resolve: () => void, reject: (err: Error) => void) => (err: Error, assets: SpriteFrame[]) => {
            if (assets) {
                TextureManager._resources.set(path, assets);
                resolve();
            } else {
                reject(err);
            }
        };

        const loadTasks: Promise<void>[] = [];
        for (const path of TextureManager._resources.keys()) {
            loadTasks.push(
                new Promise<void>((resolve, reject) => {
                    resources.loadDir(path, SpriteFrame, onProgressWrap(path), onCompleteWrap(path, resolve, reject));
                })
            );
        }
        await Promise.all(loadTasks);
    }

    public static getTexture(path: string) {
        if (!TextureManager._resources.has(path)) {
            console.log(`纹理 ${path} 不存在`);
            return null;
        }
        return TextureManager._resources.get(path);
    }
}

for (const path in TexturePathEnum) {
    TextureManager.registerTexture(TexturePathEnum[path]);
}
