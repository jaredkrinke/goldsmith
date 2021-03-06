import { assert, assertEquals } from "../../test/deps.ts";
import { Goldsmith } from "../../mod.ts";
import { goldsmithCollections } from "./mod.ts";

Deno.test({
    name: "TODO Collections are created based on pattern",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            // .use(goldsmithCollections())
            .use((files, _goldsmith) => {
                // TODO
                // pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Verification plugin should have run");
    },
});

// TODO: Test multiple collections, multiple calls, dates with time of day
