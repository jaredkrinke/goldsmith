import { GoldsmithPlugin } from "../../mod.ts";

export interface GoldsmithWatchOptions {
    directories?: string[];
}

export function goldsmithWatch(options?: GoldsmithWatchOptions): GoldsmithPlugin {
    return (_files, goldsmith) => {
        // Only start the watcher on the first build
        if (!goldsmith.metadata().__goldsmithWatchInitialized) {
            goldsmith.metadata().__goldsmithWatchInitialized = true;

            // Delay (in milliseconds) for coalescing file system-triggered rebuilds
            const delay = 200;
    
            // Only honor the final callback (i.e. the last outstanding one)
            let outstanding = 0;
            const rebuild = () => {
                if (--outstanding === 0) {
                    console.log(`Watch: rebuilding...`);
                    (async () => {
                        try {
                            await goldsmith.build();
                        } catch (e) {
                            console.log(`Watch: rebuild error: ${e}`);
                        }
                    })();
                }
            };

            // Subscribe to file system changes
            const directories = options?.directories ?? [goldsmith.source()];
            const watcher = Deno.watchFs(directories, { recursive: true });
            (async () => {
                for await (const event of watcher) {
                    console.log(`  Watch: ${event.kind} for [${event.paths.join("; ")}]`);
                    ++outstanding;
                    setTimeout(rebuild, delay);
                }
            })();
            console.log(`Watch: monitoring: [${directories.join("; ")}]...`);
        }
    };
}
