import { Prefab, resources } from 'cc';

export class PrefabManager {
    private static _resources = new Map<string, Prefab>();

    public static loadPrefabs(onProgress: (progress: number) => void): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            resources.loadDir(
                'prefab',
                Prefab,
                (finished, total) => {
                    onProgress(finished / total);
                },
                (err, assets) => {
                    if (assets) {
                        for (let prefab of assets) {
                            PrefabManager._resources.set(prefab.name, prefab);
                        }
                        resolve();
                    } else {
                        reject(err);
                    }
                }
            );
        });
    }

    public static getPrefab(name: string) {
        if (!PrefabManager._resources.has(name)) {
            console.log(`预制体 ${name} 不存在`);
            return null;
        }
        return PrefabManager._resources.get(name);
    }
}
