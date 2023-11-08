import { GoldsmithPlugin } from "../../mod.ts";

declare module "../../mod.ts" {
    interface GoldsmithMetadata {
        __goldsmithWatchInitialized?: boolean;
    }
}

export interface GoldsmithWatchOptions {
    directories?: string[];
    abortSignal?: AbortSignal;
    onRebuildCompleted?: () => void;
    delayMS?: number;
}

export function goldsmithWatch(options?: GoldsmithWatchOptions): GoldsmithPlugin {
    return (_files, goldsmith) => {
        // Only start the watcher on the first build
        if (!goldsmith.metadata().__goldsmithWatchInitialized) {
            goldsmith.metadata().__goldsmithWatchInitialized = true;

            // Delay (in milliseconds) for coalescing file system-triggered rebuilds
            const delay = options?.delayMS ?? 200;
    
            // Only honor the final callback (i.e. the last outstanding one)
            let outstanding = 0;
            const rebuild = () => {
                if (--outstanding === 0) {
                    goldsmith.startPerformanceSpan("Rebuild");
                    (async () => {
                        try {
                            await goldsmith.build();
                            goldsmith.stopPerformanceSpan("Rebuild");
                            options?.onRebuildCompleted?.();
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
                    // Respect filtering rules for paths
                    for (const absolutePath of event.paths) {
                        // Normalize path, but make no attempt to remove prefix (because there could be multiple possible directory prefixes)
                        const path = absolutePath.replace(/\\/g, "/");
                        if (goldsmith.filter(path)) {
                            console.log(`  Watch: ${event.kind} for [${event.paths.join("; ")}]`);
                            ++outstanding;
                            setTimeout(rebuild, delay);
                            break;
                        }
                    }
                }
            })();

            // Set up abort handler, if needed
            const abortSignal = options?.abortSignal;
            if (abortSignal) {
                abortSignal.addEventListener("abort", () => {
                    watcher.close();
                });
            }

            console.log(`Watch: monitoring: [${directories.join("; ")}]...`);
        }
    };
}
