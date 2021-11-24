import { assert, assertEquals } from "../../test/deps.ts";
import { Goldsmith } from "../../mod.ts";
import { goldsmithMarkdown } from "./mod.ts";

Deno.test({
    name: "TODO Test Markdown translation",
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
