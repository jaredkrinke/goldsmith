import { assertEquals } from "https://deno.land/std@0.113.0/testing/asserts.ts";
import { Goldsmith } from "./mod.ts";

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
