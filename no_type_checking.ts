// deno-lint-ignore no-unused-vars
import type { GoldsmithMetadata, GoldsmithFile } from "./mod.ts";

// This file can be used to disable strict type checking in Goldsmith.
//
// It adds `[key: string]: any` index signatures to GoldsmithMetadata and GoldsmithFile using TypeScript's
// "declaration merging" feature.

declare module "./mod.ts" {
    interface GoldsmithMetadata {
        // deno-lint-ignore no-explicit-any
        [key: string]: any;
    }

    interface GoldsmithFile {
        // deno-lint-ignore no-explicit-any
        [key: string]: any;
    }
}
