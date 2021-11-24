import { assert, assertEquals } from "../../test/deps.ts";
import { Goldsmith } from "../../mod.ts";
import { goldsmithFeed } from "./mod.ts";

Deno.test({
    name: "TODO Feed should have been generated",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            // .use(goldsmithFeed())
            .use((files, _goldsmith) => {
                // TODO
                // pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Verification plugin should have run");
    },
});

// TODO: Test with/without site metadata, test without post metadata, test with a URL with ampersand, etc.
