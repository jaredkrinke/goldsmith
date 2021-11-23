import { assert, assertEquals } from "../../deps.test.ts";
import { Goldsmith } from "../../mod.ts";
import { goldsmithFeed } from "./mod.ts";

Deno.test({
    name: "Title and keywords are read from YAML front matter on a Markdown file",
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
