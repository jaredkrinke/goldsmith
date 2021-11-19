import { assertEquals, assertThrowsAsync } from "https://deno.land/std@0.113.0/testing/asserts.ts";
import { Goldsmith, GoldsmithError } from "./mod.ts";

async function createDirectoryIfNeededAsync(path: string): Promise<void> {
    try {
        await Deno.mkdir(path);
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

async function testPathAsync(path: string, test: (info: Deno.FileInfo) => boolean): Promise<boolean> {
    let result = false;
    try {
        result = test(await Deno.stat(path));
    } catch (_) {
        // Ignore
    }
    return result;
}

const directoryExistsAsync = (path: string) => testPathAsync(path, info => info.isDirectory);
const fileExistsAsync = (path: string) => testPathAsync(path, info => info.isFile);

Deno.test({
    name: "Create output directory",
    fn: async () => {
        const dir = "out";
        try {
            await deleteIfNeededAsync(dir);
    
            await Goldsmith()
                .destination(dir)
                .build();
    
            assertEquals(true, await directoryExistsAsync(dir), "Output directory should have been created.");
        } finally {
            await deleteIfNeededAsync(dir);
        }
    },
});

Deno.test({
    name: "Output directory is required",
    fn: async () => {
        await assertThrowsAsync(() => Goldsmith().build(), GoldsmithError);
    },
});

Deno.test({
    name: "Reads directories recursively",
    fn: async () => {
        const dir = "out";
        try {
            await deleteIfNeededAsync(dir);

            await Goldsmith()
                .source("testdata/subdirs")
                .destination(dir)
                .build();
    
            assertEquals(true, await fileExistsAsync("out/subdir/test.txt"), "File from subdirectory should have been copied.");
        } finally {
            await deleteIfNeededAsync(dir);
        }
    },
});

Deno.test({
    name: "Output outside root should fail",
    fn: async () => {
        const dir = "out";
        try {
            const textEncoder = new TextEncoder();
            await deleteIfNeededAsync(dir);
    
            await assertThrowsAsync(() => Goldsmith()
                .use(files => {
                    files["../test.txt"] = { data: textEncoder.encode("nope!") };
                })
                .destination(dir)
                .build(), GoldsmithError);
    
            assertEquals(false, await fileExistsAsync("test.txt"), "File from subdirectory should have been copied.");
        } finally {
            await deleteIfNeededAsync(dir);
        }
    },
});

Deno.test({
    name: "Without specifying a clean build, files should be left as is in the output directory",
    fn: async () => {
        try {
            const filePath = "out/extra.txt";
            await createDirectoryIfNeededAsync("out");
            await Deno.writeTextFile(filePath, "hi");
    
            await Goldsmith()
                .destination("out")
                .build();
    
            assertEquals(true, await fileExistsAsync(filePath), "Extra file should have been left alone.");
        } finally {
            await deleteIfNeededAsync("out");
        }
   },
});

Deno.test({
    name: "Clean should delete everything except files starting with a dot",
    fn: async () => {
        try {
            const filePath = "out/extra.txt";
            const dotFilePath = "out/.extra";
            await createDirectoryIfNeededAsync("out");
            await Deno.writeTextFile(filePath, "hi");
            await Deno.writeTextFile(dotFilePath, "hi");
    
            await Goldsmith()
                .destination("out")
                .clean(true)
                .build();
    
            assertEquals(false, await fileExistsAsync(filePath), "Extra file should have been deleted.");
            assertEquals(true, await fileExistsAsync(dotFilePath), "Extra file starting with a dot should have been left alone.");
        } finally {
            await deleteIfNeededAsync("out");
        }
    },
});

Deno.test({
    name: "Metadata set in one plugin should be visible to later plugins",
    fn: async () => {
        // TODO
    },
});

// TODO: Test metadata get/set, built event
