import { assertEquals, assertThrowsAsync } from "https://deno.land/std@0.113.0/testing/asserts.ts";
import { Goldsmith, GoldsmithError } from "./mod.ts";

Deno.test({
    name: "Create output directory",
    fn: async () => {
        try {
            await Deno.remove("out", { recursive: true });
        } catch (_) {
            // Ignore
        }

        await Goldsmith()
            .destination("out")
            .build();
        
        let directoryExists = false;
        try {
            const info = await Deno.stat("out");
            directoryExists = info.isDirectory;
        } catch (_) {
            // Ignore
        }

        assertEquals(true, directoryExists, "Output directory should have been created.");
    },
});

Deno.test({
    name: "Output directory is required",
    fn: async () => {
        await assertThrowsAsync<GoldsmithError>(() => Goldsmith().build());
    },
});

// TODO: Test reading files with subdirs, output outside root (should fail), metadata get/set, clean vs not, built event
