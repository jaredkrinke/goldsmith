import { assert, assertEquals } from "../../test/deps.ts";
import { Goldsmith } from "../../mod.ts";
import { goldsmithFileMetadata } from "./mod.ts";

declare module "../../mod.ts" {
    interface GoldsmithFile {
        category?: string;
    }
}

Deno.test({
    name: "Drafts directory example",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            .use((files, goldsmith) => {
                files["page1.md"] = { data: goldsmith.encodeUTF8("Not a draft") };
                files["drafts/page2.md"] = { data: goldsmith.encodeUTF8("This is a draft") };
            })
            .use(goldsmithFileMetadata({
                pattern: /^drafts\//,
                metadata: { draft: true },
            }))
            .use((files, _goldsmith) => {
                assertEquals(files["page1.md"].draft, undefined);
                assertEquals(files["drafts/page2.md"].draft, true);
                pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Verification plugin should have run");
    },
});


Deno.test({
    name: "Category from directory example",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            .use((files, goldsmith) => {
                files["topic1/page1.md"] = { data: goldsmith.encodeUTF8("Page") };
                files["topic1/page2.md"] = { data: goldsmith.encodeUTF8("Page") };
                files["topic2/page3.md"] = { data: goldsmith.encodeUTF8("Page") };
            })
            .use(goldsmithFileMetadata({
                pattern: /([^/]+)\/[^/]+\.md$/,
                metadata: (_file, matches, _goldsmith) => ({
                    category: matches[1],
                }),
            }))
            .use((files, _goldsmith) => {
                assertEquals(files["topic1/page1.md"].category, "topic1");
                assertEquals(files["topic1/page2.md"].category, "topic1");
                assertEquals(files["topic2/page3.md"].category, "topic2");
                pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Verification plugin should have run");
    },
});
