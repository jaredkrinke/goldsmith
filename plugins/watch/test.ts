import { assertEquals } from "../../deps.test.ts";
import { Goldsmith, GoldsmithObject } from "../../mod.ts";
import { goldsmithWatch } from "./mod.ts";

async function createDirectoryIfNeededAsync(path: string): Promise<void> {
    try {
        await Deno.mkdir(path, { recursive: true });
    } catch (_) {
        // Ignore
    }
}

async function deleteIfNeededAsync(path: string): Promise<void> {
    try {
        await Deno.remove(path, { recursive: true });
    } catch (_) {
        // Ignore
    }
}

Deno.test({
    name: "Rebuild should be triggered on file update",
    fn: async () => {
        const inputDirectory = "testdata/watch";
        const outputDirectory = "out";
        await deleteIfNeededAsync(inputDirectory);
        await createDirectoryIfNeededAsync(inputDirectory);
        try {
            // Populate input directory
            const test1Path = `${inputDirectory}/test1.txt`;
            await Deno.writeTextFile(test1Path, "Hello");

            // Build and start watching
            const abortController = new AbortController();
            let pluginExecutionCount = 0;
            let go: GoldsmithObject | undefined;
            await Goldsmith()
                .source(inputDirectory)
                .destination(outputDirectory)
                .clean(true)
                .use(goldsmithWatch({
                    abortSignal: abortController.signal,
                }))
                .use((_files, goldsmith) => {
                    go = goldsmith;
                    ++pluginExecutionCount;
                })
                .build();
        
            assertEquals(pluginExecutionCount, 1, "Verification plugin should have run once");
            assertEquals(await Deno.readTextFile(test1Path), "Hello");

            // Setup timeout and build event handler
            const timerId = setTimeout(() => abortController.abort(), 5000);
            const waitForBuildAsync = () => new Promise<void>((resolve, reject) => {
                const timeoutHandler = () => reject("Timed out waiting for build event!");
                go!.addEventListener("built", () => {
                    abortController.signal.removeEventListener("abort", timeoutHandler);
                    resolve();
                }, { once: true });
                abortController.signal.addEventListener("abort", timeoutHandler, { once: true });
            });

            await Deno.writeTextFile(test1Path, "Again");
            await waitForBuildAsync();
            assertEquals(await Deno.readTextFile(test1Path), "Again");
            assertEquals(pluginExecutionCount, 2, "Verification plugin should have run again");

            abortController.abort();
            clearTimeout(timerId);
        } finally {
            await deleteIfNeededAsync(inputDirectory);
            await deleteIfNeededAsync(outputDirectory);
        }
    },
});

// TODO: Test multiple directories
