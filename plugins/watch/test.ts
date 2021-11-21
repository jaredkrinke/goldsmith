import { assert, assertEquals } from "../../deps.test.ts";
import { Goldsmith } from "../../mod.ts";
import { goldsmithWatch } from "./mod.ts";

Deno.test({
    name: "Rebuild should be triggered on file update",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            .use(goldsmithWatch())
            .use((files, _goldsmith) => {
                // TODO
                // pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Verification plugin should have run");
    },
});

// TODO: Test multiple directories
