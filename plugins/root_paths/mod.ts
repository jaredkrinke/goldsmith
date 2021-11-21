import { GoldsmithPlugin } from "../../mod.ts";

declare module "../../mod.ts" {
    interface GoldsmithFile {
        pathToRoot?: string;
        pathFromRoot?: string;
    }
}

function pathToRoot(path: string): string {
    return "../".repeat(Array.from(path.matchAll(/[/]/g)).length);
}

export function goldsmithRootPaths(): GoldsmithPlugin {
    return (files) => {
        for (const key of Object.keys(files)) {
            const file = files[key];
            file.pathToRoot = pathToRoot(key);
            file.pathFromRoot = key;
        }
    };
}
