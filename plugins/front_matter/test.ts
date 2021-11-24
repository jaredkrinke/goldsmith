import { assert, assertEquals } from "../../deps.test.ts";
import { Goldsmith } from "../../mod.ts";
import { goldsmithFrontMatter } from "./mod.ts";

Deno.test({
    name: "Title and keywords are read from YAML front matter on a Markdown file",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            .use((files, goldsmith) => {
                files["page.md"] = { data: goldsmith.encodeUTF8(`---
title: An example page
date: 2021-11-19
keywords: [goldsmith,yaml]
---
# Heading
This is just normal Markdown content here.
`)};
            })
            .use(goldsmithFrontMatter())
            .use((files, _goldsmith) => {
                const { title, date, keywords } = files["page.md"];
                assertEquals(title, "An example page");
                assertEquals(date, new Date("2021-11-19"));
                assertEquals(keywords, ["goldsmith", "yaml"]);
                pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Verification plugin should have run");
    },
});

// TODO: Test other file types, custom patterns, other YAML array style, Unicode properties, dates with time of day
