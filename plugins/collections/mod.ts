import type { GoldsmithPlugin } from "../../mod.ts";

declare module "../../mod.ts" {
    interface GoldsmithMetadata {
        collections?: {
            [collectionName: string]: GoldsmithFile[];
        };
    }
}

type SortableType = number | Date | string;

export interface GoldsmithCollection {
    pattern: RegExp;
    sortBy: string;
    reverse?: boolean;
    limit?: number;
}

export function goldsmithCollections(collectionMap: { [collectionName: string]: GoldsmithCollection}): GoldsmithPlugin {
    return (files, goldsmith) => {
        for (const collectionKey of Object.keys(collectionMap)) {
            const collection = collectionMap[collectionKey];

            const { pattern, sortBy } = collection;
            const reverse = collection.reverse ?? false;
            const limit = collection.limit;

            const list = [];
            for (const key of Object.keys(files)) {
                if (pattern.test(key)) {
                    list.push(files[key]);
                }
            }
    
            list.sort((a, b) => {
                const sa = a[sortBy] as SortableType;
                const sb = b[sortBy] as SortableType;

                return (sa < sb) ? -1 : ((sa > sb) ? 1 : 0);
            });
            
            if (reverse) {
                list.reverse();
            }
            if (limit !== undefined) {
                list.splice(limit);
            }

            const metadata = goldsmith.metadata();
            if (!metadata.collections) {
                metadata.collections = {};
            }
            metadata.collections[collectionKey] = list;
        }
    };
}
