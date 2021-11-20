import { assert, assertEquals } from "../../deps.test.ts";
import { Goldsmith } from "../../mod.ts";
import { goldsmithJSONMetadata } from "./mod.ts";

const testMetadata = {
    title: "My awesome site",
    description: "A truly awesome site",
};

Deno.test({
    name: "Properties are read from JSON and applied to a property of global metadata",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            .use((files, goldsmith) => {
                files["site.json"] = { data: goldsmith.encodeUTF8(JSON.stringify(testMetadata))};
            })
            .use(goldsmithJSONMetadata({ "site.json": "site" }))
            .use((_files, goldsmith) => {
                assertEquals(goldsmith.metadata().site, testMetadata);
                pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Verification plugin should have run");
    },
});

Deno.test({
    name: "Properties are read from JSON and applied directly to global metadata",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            .use((files, goldsmith) => {
                files["site.json"] = { data: goldsmith.encodeUTF8(JSON.stringify(testMetadata))};
            })
            .use(goldsmithJSONMetadata({ "site.json": "" }))
            .use((_files, goldsmith) => {
                assertEquals(goldsmith.metadata(), testMetadata);
                pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Verification plugin should have run");
    },
});

Deno.test({
    name: "Properties are read from JSON and applied directly to global metadata",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            .use((files, goldsmith) => {
                files["site.json"] = { data: goldsmith.encodeUTF8(JSON.stringify(testMetadata))};
            })
            .use(goldsmithJSONMetadata("site.json"))
            .use((_files, goldsmith) => {
                assertEquals(goldsmith.metadata(), testMetadata);
                pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Verification plugin should have run");
    },
});

Deno.test({
    name: "Properties are read from multiple JSON files",
    fn: async () => {
        const testMetadata2 = { test2: "Test2!" };

        let pluginExecuted = false;
        await Goldsmith()
            .use((files, goldsmith) => {
                files["site.json"] = { data: goldsmith.encodeUTF8(JSON.stringify(testMetadata))};
                files["other/file.json"] = { data: goldsmith.encodeUTF8(JSON.stringify(testMetadata2))};
            })
            .use(goldsmithJSONMetadata({
                "site.json": "site",
                "other/file.json": "other",
            }))
            .use((_files, goldsmith) => {
                assertEquals(goldsmith.metadata().site, testMetadata);
                assertEquals(goldsmith.metadata().other, testMetadata2);
                pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Verification plugin should have run");
    },
});
