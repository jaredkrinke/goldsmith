import { GoldsmithFile, GoldsmithMetadata, GoldsmithPlugin } from "../../mod.ts";

export type GoldsmithFileMetadataOnly = Omit<GoldsmithFile, "data">;
export type GoldsmithFileCreateMetadataCallback = (file: GoldsmithFile, matches: RegExpMatchArray, globalMetadata: GoldsmithMetadata) => GoldsmithFileMetadataOnly;

export interface GoldsmithFileMetadataOptions {
    /** Only files matching this pattern will have metadata added. */
    pattern: RegExp;

    /** Either static metadata to add to the files or a function to dynamically compute metadata to add.
     * 
     * The callback receives the file itself, any groups from the RegExp match, and global metadata.
    */
    metadata: GoldsmithFileMetadataOnly | GoldsmithFileCreateMetadataCallback;
}

/** Goldsmith plugin for adding metadata to files matching a pattern.
 * 
 * The metadata can optionally be dynamically computed using a callback that receives the file itself, any groups from the RegExp match, and global metadata. */
export function goldsmithFileMetadata(options: GoldsmithFileMetadataOptions): GoldsmithPlugin {
    const { pattern, metadata } = options;
    return (files, goldsmith) => {
        for (const key of Object.keys(files)) {
            const matches = pattern.exec(key);
            if (matches) {
                const file = files[key];
                Object.assign(file, (typeof(metadata) === "function") ? metadata(file, matches, goldsmith.metadata()) : metadata);
            }
        }
    };
}
