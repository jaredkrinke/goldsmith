import type { GoldsmithFile, GoldsmithObject, GoldsmithPlugin } from "../../mod.ts";

declare module "../../mod.ts" {
    interface GoldsmithFile {
        layout?: string | false;
    }
}

export type GoldsmithLayoutCallback = (file: GoldsmithFile, goldsmith: GoldsmithObject) => (string | undefined);

export interface GoldsmithLayoutOptions {
    pattern: RegExp;
    layout: GoldsmithLayoutCallback;
}

export function goldsmithLayout(options: GoldsmithLayoutOptions): GoldsmithPlugin {
    const { pattern, layout } = options;
    return (files, goldsmith) => {
        for (const key of Object.keys(files)) {
            if (pattern.test(key)) {
                const file = files[key];
                const result = layout(file, goldsmith);
                if (result !== undefined) {
                    file.data = goldsmith.encodeUTF8(result);
                }
            }
        }
    };
}
