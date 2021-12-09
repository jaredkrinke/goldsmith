import { GoldsmithPlugin } from "../../mod.ts";

export type GoldsmithJSONMetadataMap = string | { [property: string]: string };

export interface GoldsmithJSONMetadataOptions {
    merge?: boolean;
}

export class GoldsmithJSONMetadataError extends Error {
    filePath: string;

    constructor(filePath: string, inputDirectory: string) {
        super(`Required file "${filePath}" was not found in input directory "${inputDirectory}"`);
        this.filePath = filePath;
    }
}

/** Goldsmith plugin for reading global metadata from one or more JSON files. */
export function goldsmithJSONMetadata(stringOrMap: GoldsmithJSONMetadataMap, options?: GoldsmithJSONMetadataOptions): GoldsmithPlugin {
    const rows: { path: string, propertyName?: string }[] = [];
    if (typeof(stringOrMap) === "string") {
        rows.push({ path: stringOrMap });
    } else {
        const map = stringOrMap;
        rows.push(...Object.keys(map).map(key => ({
            path: key,
            propertyName: map[key],
        })));
    }

    return (files, goldsmith) => {
        for (const { path, propertyName } of rows) {
            const file = files[path];
            if (!file) {
                throw new GoldsmithJSONMetadataError(path, goldsmith.source());
            }

            delete files[path];
            const parsedObject = JSON.parse(goldsmith.decodeUTF8(file.data));
            const metadataOptions = { merge: options?.merge };
            if (propertyName) {
                goldsmith.metadata({ [propertyName]: parsedObject}, metadataOptions);
            } else {
                goldsmith.metadata(parsedObject, metadataOptions);
            }
        }
    };
}
