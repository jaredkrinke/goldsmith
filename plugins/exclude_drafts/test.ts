import { assert } from "../../deps.test.ts";
import { Goldsmith } from "../../mod.ts";
import { goldsmithExcludeDrafts } from "./mod.ts";

Deno.test({
    name: "Drafts should be removed",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            .use((files, goldsmith) => {
                files["published.txt"] = {
                    data: goldsmith.encodeUTF8("Published"),
                };

                files["draft.txt"] = {
                    draft: true,
                    data: goldsmith.encodeUTF8("Not published"),
                };
            })
            .use(goldsmithExcludeDrafts())
            .use((files, _goldsmith) => {
                assert(files["published.txt"] !== undefined, "Non-draft file should be left alone");
                assert(files["draft.txt"] === undefined, "Draft file should have been removed");
                pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Verification plugin should have run");
    },
});

// TODO: Test with exclude=false
