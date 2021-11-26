import { assertEquals } from "../../test/deps.ts";
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

interface RebuildTest {
    shouldRebuild: boolean;
    prepare: () => Promise<void>;
    verify: () => Promise<void>;
}

async function runRebuildTestsAsync(goldsmith: GoldsmithObject, tests: RebuildTest[]) {
    for (const test of tests) {
        const waitForEventAsync = () => new Promise<void>((resolve, reject) => {
            const tid = setTimeout(() => {
                goldsmith.removeEventListener("built", buildHandler);
                if (test.shouldRebuild) {
                    reject("Timed out waiting for build event!");
                } else {
                    resolve();
                }
            }, test.shouldRebuild ? 5000 : 500); // Shorter timeout when expecting nothing to happen
            const buildHandler = () => {
                clearTimeout(tid);
                if (test.shouldRebuild) {
                    resolve();
                } else {
                    reject("Received unexpected build event!");
                }
            }
            goldsmith.addEventListener("built", buildHandler, { once: true });
        });

        const eventPromise = waitForEventAsync();
        await test.prepare();
        await eventPromise;
        await test.verify();
    }
}

Deno.test({
    name: "Rebuild should be triggered on included file update",
    fn: async () => {
        const inputDirectory = "test/data/watch";
        const outputDirectory = "out";
        await deleteIfNeededAsync(inputDirectory);
        await createDirectoryIfNeededAsync(inputDirectory);
        try {
            // Populate input directory
            const test1Path = `${inputDirectory}/test1.txt`;
            const testDotFilePath = `${inputDirectory}/.test1.txt`;
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

            try {
                await runRebuildTestsAsync(go!, [
                    {
                        shouldRebuild: true,
                        prepare: async () => { await Deno.writeTextFile(test1Path, "Again") },
                        verify: async () => {
                            assertEquals(await Deno.readTextFile(test1Path), "Again");
                            assertEquals(pluginExecutionCount, 2, "Verification plugin should have run again");
                        }
                    },
                    {
                        shouldRebuild: false,
                        prepare: async () => { await Deno.writeTextFile(testDotFilePath, "Oops") },
                        verify: async () => {
                            assertEquals(await Deno.readTextFile(test1Path), "Again");
                            assertEquals(pluginExecutionCount, 2, "Verification plugin should NOT have run again");
                        }
                    },
                    {
                        shouldRebuild: true,
                        prepare: async () => { await Deno.writeTextFile(test1Path, "And again") },
                        verify: async () => {
                            assertEquals(await Deno.readTextFile(test1Path), "And again");
                            assertEquals(pluginExecutionCount, 3, "Verification plugin should have run again");
                        }
                    },
                ]);
            } finally {
                abortController.abort();
            }
        } finally {
            await deleteIfNeededAsync(inputDirectory);
            await deleteIfNeededAsync(outputDirectory);
        }
    },
});

// TODO: Test multiple directories
