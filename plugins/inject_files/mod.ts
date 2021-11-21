import { GoldsmithFile, GoldsmithMetadata, GoldsmithPlugin } from "../../mod.ts";

type GoldsmithFileMetadataOnly = Omit<GoldsmithFile, "data">;

type GoldsmithInjectFilesDataCallback = (metadata: GoldsmithMetadata) => (Uint8Array | string);

type GoldsmithInjectedFile = GoldsmithFileMetadataOnly & {
    data?: string | Uint8Array | GoldsmithInjectFilesDataCallback;
};

export interface GoldsmithInjectFilesOptions {
    [path: string]: GoldsmithInjectedFile;
}

export function goldsmithInjectFiles(options: GoldsmithInjectFilesOptions): GoldsmithPlugin {
    return (files, goldsmith) => {
        for (const key of Object.keys(options)) {
            const { data: stringOrDataOrCallback, ...rest } = options[key];
            let data: Uint8Array;
            switch (typeof(stringOrDataOrCallback)) {
                case "undefined":
                    data = new Uint8Array(0);
                    break;

                case "string":
                    data = goldsmith.encodeUTF8(stringOrDataOrCallback);
                    break;
                
                case "function":
                    {
                        const stringOrBytes = stringOrDataOrCallback(goldsmith.metadata());
                        switch (typeof(stringOrBytes)) {
                            case "string":
                                data = goldsmith.encodeUTF8(stringOrBytes);
                                break;
                            
                            default:
                                data = stringOrBytes;
                                break;
                        }
                    }
                    break;

                default:
                    data = stringOrDataOrCallback;
                    break;
            }

            files[key] = { data, ...rest };
        }
    };
}
