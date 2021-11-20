import { assert, assertEquals } from "../../deps.test.ts";
import { Goldsmith } from "../../mod.ts";
import { goldsmithIndex } from "./mod.ts";

Deno.test({
    name: "Term index pages should be created for each unique term",
    fn: async () => {
        let pluginExecuted = false;
        const pattern = /\.md$/;
        await Goldsmith()
            .use((files, goldsmith) => {
                files["page1.md"] = { title: "A post about both Goldsmith and YAML", keywords: ["goldsmith", "yaml"], data: new Uint8Array() };
                files["page2.md"] = { title: "A post about only Goldsmith", keywords: ["goldsmith"], data: new Uint8Array() };
                files["page3.md"] = { title: "A post about only YAML", keywords: ["yaml"], data: new Uint8Array() };
            })
            .use(goldsmithIndex({
                pattern,
                property: "keywords",
                createTermIndexPath: term => `index_${term}.html`,
            }))
            .use((files, goldsmith) => {
                const metadata = goldsmith.metadata();
                assert(files["index_goldsmith.html"] !== undefined);
                assert(files["index_yaml.html"] !== undefined);
                assert(metadata.indexes!.keywords[files["index_goldsmith.html"].term!].map(f => f.title).join(", "), "A post about both Goldsmith and YAML, A post about only Goldsmith");
                assert(metadata.indexes!.keywords[files["index_yaml.html"].term!].map(f => f.title).join(", "), "A post about both Goldsmith and YAML, A post about only YAML");
                pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Verification plugin should have run");
    },
});

// TODO: Test patterns and without term index pages
