import { GoldsmithPlugin } from "../../mod.ts";

export type GoldsmithJSONMetadataOptions = string | { [property: string]: string };

export class GoldsmithJSONMetadataError extends Error {
    filePath: string;

    constructor(filePath: string, inputDirectory: string) {
        super(`Required file "${filePath}" was not found in input directory "${inputDirectory}"`);
        this.filePath = filePath;
    }
}

/** Goldsmith plugin for reading global metadata from one or more JSON files. */
export function goldsmithJSONMetadata(stringOrOptions: GoldsmithJSONMetadataOptions): GoldsmithPlugin {
    const rows: { path: string, propertyName?: string }[] = [];
    if (typeof(stringOrOptions) === "string") {
        rows.push({ path: stringOrOptions });
    } else {
        const options = stringOrOptions;
        rows.push(...Object.keys(options).map(key => ({
            path: key,
            propertyName: options[key],
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
            if (propertyName) {
                goldsmith.metadata({ [propertyName]: parsedObject});
            } else {
                goldsmith.metadata(parsedObject);
            }
        }
    };
}
