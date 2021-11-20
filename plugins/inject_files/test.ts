import { assert, assertEquals } from "../../deps.test.ts";
import { Goldsmith } from "../../mod.ts";
import { goldsmithInjectFiles } from "./mod.ts";

Deno.test({
    name: "TODO",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            // .use(goldsmithInjectFiles())
            .use((files, _goldsmith) => {
                // TODO
                // pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Verification plugin should have run");
    },
});

// TODO: String, bytes, callback, undefined; multiple files
