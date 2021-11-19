import { assert, assertEquals, assertThrowsAsync } from "https://deno.land/std@0.113.0/testing/asserts.ts";
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
    
            assert(await directoryExistsAsync(dir), "Output directory should have been created.");
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
    
            assert(await fileExistsAsync("out/subdir/test.txt"), "File from subdirectory should have been copied.");
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
    
            assertEquals(await fileExistsAsync("test.txt"), false, "File should not be written outside output root.");
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
    
            assert(await fileExistsAsync(filePath), "Extra file should have been left alone.");
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
    
            assertEquals(await fileExistsAsync(filePath), false, "Extra file should have been deleted.");
            assert(await fileExistsAsync(dotFilePath), "Extra file starting with a dot should have been left alone.");
        } finally {
            await deleteIfNeededAsync("out");
        }
    },
});

Deno.test({
    name: "Global metadata set in one plugin should be visible to later plugins",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            .use((_files, goldsmith) => {
                goldsmith.metadata({
                    property: "Property",
                    nested: {
                        property: "Nested",
                    },
                });
            })
            .use((_files, goldsmith) => {
                const metadata = goldsmith.metadata();
                assertEquals(metadata.property, "Property");
                assertEquals((metadata.nested as { property: string }).property, "Nested");
                pluginExecuted = true;
            })
            .run();
        
        assertEquals(pluginExecuted, true, "Plugin should have run");
    },
});

Deno.test({
    name: "File metadata set in one plugin should be visible to later plugins",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            .use(files => {
                files["file"] = {
                    property: "Property",
                    nested: {
                        property: "Nested",
                    },
                    data: new Uint8Array(),
                };
            })
            .use(files => {
                const file = files["file"];
                assertEquals(file.property, "Property");
                assertEquals((file.nested as { property: string }).property, "Nested");
                pluginExecuted = true;
            })
            .run();
        
        assertEquals(pluginExecuted, true, "Plugin should have run");
    },
});

Deno.test({
    name: "Text decoding and encoding should preserve characters",
    fn: async () => {
        try {
            await deleteIfNeededAsync("out");
    
            await Goldsmith()
                .source("testdata/encoding")
                .destination("out")
                .use((files, goldsmith) => {
                    for (const key of Object.keys(files)) {
                        const file = files[key];
                        file.data = goldsmith.encodeUTF8(goldsmith.decodeUTF8(file.data));
                    }
                })
                .build();

            assert(await fileExistsAsync("out/ansi.txt"));
            assertEquals(await Deno.readTextFile("out/ansi.txt"), "Just some text...", "ANSI encoding should round-trip successfully");

            assert(await fileExistsAsync("out/crlf.txt"));
            assertEquals(await Deno.readTextFile("out/crlf.txt"), "Just some text...\r\n...with a line break!", "CRLF ending should round-trip successfully");
            assert(await fileExistsAsync("out/lf.txt"));
            assertEquals(await Deno.readTextFile("out/lf.txt"), "Just some text...\n...with a line break!", "LF ending should round-trip successfully");

            for (const file of [
                "out/utf8.txt",
                "out/utf8bom.txt",
            ]) {
                assert(await fileExistsAsync(file));
                assertEquals(await Deno.readTextFile(file), "子曰：「學而時習之，不亦說乎？有朋自遠方來，不亦樂乎？人不知而不慍，不亦君子乎？」بِسْمِ ٱللّٰهِ ٱلرَّحْمـَبنِ ٱلرَّحِيمِ", `Unicode encoding "${file}" should round-trip successfully`);
            }

        } finally {
            await deleteIfNeededAsync("out");
        }
    },
});

Deno.test({
    name: "\"Built\" event should be fired after the build completes",
    fn: async () => {
        const dir = "out";
        try {
            let builtEventFired = false;
            await deleteIfNeededAsync(dir);

            await Goldsmith()
                .source("testdata/subdirs")
                .destination(dir)
                .use((_files, goldsmith) => {
                    goldsmith.addEventListener("built", () => {
                        builtEventFired = true;
                    });
                })
                .build();

            assert(builtEventFired, "\"Built\" event should have fired now that the build has completed");
        } finally {
            await deleteIfNeededAsync(dir);
        }
    },
});
