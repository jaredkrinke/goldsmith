import { assert, assertEquals } from "../../deps.test.ts";
import { Goldsmith } from "../../mod.ts";
import { goldsmithLayout } from "./mod.ts";

Deno.test({
    name: "Layout callbacks are called based on layout property",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            // .use(goldsmithLayout())
            .use((files, _goldsmith) => {
                // TODO
                // pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Verification plugin should have run");
    },
});

// TODO: Multiple templates; separate file for each layout engine
