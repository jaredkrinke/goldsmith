import { assert, assertEquals } from "../../deps.test.ts";
import { Goldsmith } from "../../mod.ts";
import { goldsmithMarkdown } from "./mod.ts";

Deno.test({
    name: "Test Markdown translation",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            // .use(goldsmithMarkdown())
            .use((files, _goldsmith) => {
                // TODO
                // pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Verification plugin should have run");
    },
});

// TODO: Test files removed, syntax callback, link replacement
