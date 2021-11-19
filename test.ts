import { assertEquals, assertThrowsAsync } from "https://deno.land/std@0.113.0/testing/asserts.ts";
import { Goldsmith, GoldsmithError } from "./mod.ts";

async function removeIfNeeded(path: string): Promise<void> {
    try {
        await Deno.remove("out", { recursive: true });
    } catch (_) {
        // Ignore
    }
}

async function testPath(path: string, test: (info: Deno.FileInfo) => boolean): Promise<boolean> {
    let result = false;
    try {
        result = test(await Deno.stat(path));
    } catch (_) {
        // Ignore
    }
    return result;
}

const directoryExists = (path: string) => testPath(path, info => info.isDirectory);
const fileExists = (path: string) => testPath(path, info => info.isFile);

Deno.test({
    name: "Create output directory",
    fn: async () => {
        const dir = "out";
        await removeIfNeeded(dir);

        await Goldsmith()
            .destination(dir)
            .build();

        assertEquals(true, await directoryExists(dir), "Output directory should have been created.");
    },
});

Deno.test({
    name: "Output directory is required",
    fn: async () => {
        await assertThrowsAsync<GoldsmithError>(() => Goldsmith().build());
    },
});

Deno.test({
    name: "Reads directories recursively",
    fn: async () => {
        const dir = "out";
        await removeIfNeeded(dir);

        await Goldsmith()
            .source("testdata/subdirs")
            .destination(dir)
            .build();

        assertEquals(true, await fileExists("out/subdir/test.txt"), "File from subdirectory should have been copied.");
    },
});

// TODO: Test output outside root (should fail), metadata get/set, clean vs not, built event
