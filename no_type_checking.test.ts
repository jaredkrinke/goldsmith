import { assert, assertEquals } from "./deps.test.ts";
import { Goldsmith } from "./mod.ts";
import type {} from "./no_type_checking.ts";

Deno.test({
    name: "Type checking can be mostly skipped by importing no_type_checking.ts",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            .metadata({
                globalPropertyLOL: "ha",
            })
            .use((files, goldsmith) => {
                files["page.md"] = {
                    lol: true,
                    blah: {
                        blah: {
                            blah: "yes",
                        },
                    },
                    data: goldsmith.encodeUTF8(`Hi`),
                };
            })
            .use((files, goldsmith) => {
                const file = files["page.md"];
                assertEquals(file.lol, true);
                assertEquals(file.blah.blah.blah, "yes");
                assertEquals(goldsmith.metadata().globalPropertyLOL, "ha");
                pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Verification plugin should have run");
    },
});
