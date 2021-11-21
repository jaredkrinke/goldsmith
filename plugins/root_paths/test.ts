import { assert, assertEquals } from "../../deps.test.ts";
import { Goldsmith } from "../../mod.ts";
import { goldsmithRootPaths } from "./mod.ts";

Deno.test({
    name: "Paths to and from root at multiple levels should be correct",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            .use(goldsmithRootPaths())
            .use((files, _goldsmith) => {
                // TODO
                // pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Verification plugin should have run");
    },
});

// TODO: Test path to/from root, including at root and subdirectories
