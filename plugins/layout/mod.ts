import type { GoldsmithFile, GoldsmithMetadata, GoldsmithPlugin } from "../../mod.ts";

declare module "../../mod.ts" {
    interface GoldsmithFile {
        layout?: string | false;
    }
}

export type GoldsmithLayoutCallback = (file: GoldsmithFile, metadata: GoldsmithMetadata) => Uint8Array;

export interface GoldsmithLayoutOptions {
    pattern: RegExp;
    layout: GoldsmithLayoutCallback;
}

export function goldsmithLayout(options: GoldsmithLayoutOptions): GoldsmithPlugin {
    const { pattern, layout } = options;
    return (files, goldsmith) => {
        const metadata = goldsmith.metadata(); 
        for (const key of Object.keys(files)) {
            if (pattern.test(key)) {
                const file = files[key];
                file.data = layout(file, metadata);
            }
        }
    };
}
