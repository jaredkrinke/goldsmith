import { GoldsmithPlugin } from "../../mod.ts";

export class GoldsmithLinkCheckerError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export function goldsmithLinkChecker(): GoldsmithPlugin {
    return (_files, _goldsmith) => {};
}
