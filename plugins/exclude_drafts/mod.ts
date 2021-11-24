import { GoldsmithPlugin } from "../../mod.ts";

declare module "../../mod.ts" {
    interface GoldsmithFile {
        draft?: boolean;
    }
}

/** Trivial plugin to exclude files that have a `draft` property set to `true`. */
export function goldsmithExcludeDrafts(exclude?: boolean): GoldsmithPlugin {
    const excludeDrafts = exclude ?? true;
    return (files) => {
        if (excludeDrafts) {
            for (const key of Object.keys(files)) {
                const file = files[key];
                if (file.draft) {
                    delete files[key];
                }
            }
        }
    };
}
