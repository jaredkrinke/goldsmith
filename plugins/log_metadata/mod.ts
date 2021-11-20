import { GoldsmithPlugin } from "../../mod.ts";

/** Trivial Goldsmith plugin for logging Goldsmith's global and per-file metadata to the console during a build. */
export function goldsmithLogMetadata(): GoldsmithPlugin {
    return (files, goldsmith) => {
        const fileInfo: { [path: string]: { [prop: string]: unknown } } = {};
        Object.keys(files).forEach(key => {
            const { data, ...rest } = files[key];
            fileInfo[key] = {
                ...rest,
                ["data.length"]: data.length,
            };
        });

        console.log("===== Global metadata =====");
        console.log(goldsmith.metadata());
        console.log("\n===== Files =====");
        for (const path of Object.keys(fileInfo)) {
            console.log("");
            console.log(`${path}:`);
            console.log(fileInfo[path]);
        }
    };
}
