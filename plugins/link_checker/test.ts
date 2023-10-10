import { assert, assertRejects } from "../../test/deps.ts";
import { Goldsmith, GoldsmithFileCollection, GoldsmithObject } from "../../mod.ts";
import { goldsmithLinkChecker, GoldsmithLinkCheckerError } from "./mod.ts";

function addTestData(files: GoldsmithFileCollection, goldsmith: GoldsmithObject): void {
    // Link sources
    files["sources/body.html"] = { data: goldsmith.encodeUTF8(`<html><body><a href="../targets/page1.html">Page 1</a></body></html>`) };
    files["sources/bodyWithAnchor.html"] = { data: goldsmith.encodeUTF8(`<html><body><a href="../targets/page2.html#anchor">Page 2, with anchor</a></body></html>`) };
    files["sources/bodyWithInternalAnchor.html"] = { data: goldsmith.encodeUTF8(`<html><body><a href="#heading-5">Page 2, with anchor</a><h5 name="heading-5">Hi</h5></body></html>`) };
    files["sources/link.html"] = { data: goldsmith.encodeUTF8(`<html><head><link rel="stylesheet" href="../css/test.css" /></head><body>Nothing here</body></html>`) };
    files["sources/image.html"] = { data: goldsmith.encodeUTF8(`<html><body><img src="../assets/img.png"></body></html>`) };
    files["sources/imageClosed.html"] = { data: goldsmith.encodeUTF8(`<html><body><img src="../assets/img.png"/></body></html>`) };

    // Link targets
    files["targets/page1.html"] = { data: goldsmith.encodeUTF8(`<html><body><h1>Page 1</h1></body></html>`) };
    files["targets/page2.html"] = { data: goldsmith.encodeUTF8(`<html><body><h1 id="anchor">Page 1</h1></body></html>`) };
    files["css/test.css"] = { data: goldsmith.encodeUTF8(`body { font-size: 120%; }`) };
    files["assets/img.png"] = { data: goldsmith.encodeUTF8(`PNG`) };
}

function testWithBrokenLinkAsync(prepare: (files: GoldsmithFileCollection, goldsmith: GoldsmithObject) => void): Promise<GoldsmithFileCollection> {
    return Goldsmith()
        .use((files, goldsmith) => {
            addTestData(files, goldsmith);
            prepare(files, goldsmith);
        })
        .use(goldsmithLinkChecker())
        .run();
}

Deno.test({
    name: "All valid links",
    fn: async () => {
        let pluginExecuted = false;
        await Goldsmith()
            .use(addTestData)
            .use(goldsmithLinkChecker())
            .use((_files, _goldsmith) => {
                pluginExecuted = true;
            })
            .run();
    
        assert(pluginExecuted, "Link should have been validated successfully");
    },
});

Deno.test({
    name: "Broken page link",
    fn: async () => {
        await assertRejects(() => testWithBrokenLinkAsync((files, goldsmith) => {
            files["sources/body.html"] = { data: goldsmith.encodeUTF8(`<html><body><a href="../targets/page10.html">Page 1</a></body></html>`) };
        }), GoldsmithLinkCheckerError);
    },
});

Deno.test({
    name: "Broken anchor",
    fn: async () => {
        await assertRejects(() => testWithBrokenLinkAsync((files, goldsmith) => {
            files["sources/bodyWithAnchor.html"] = { data: goldsmith.encodeUTF8(`<html><body><a href="../targets/page2.html#anchored">Page 2, with anchor</a></body></html>`) };
        }), GoldsmithLinkCheckerError);
    },
});

Deno.test({
    name: "Broken internal anchor",
    fn: async () => {
        await assertRejects(() => testWithBrokenLinkAsync((files, goldsmith) => {
            files["sources/bodyWithInternalAnchor.html"] = { data: goldsmith.encodeUTF8(`<html><body><a href="#heading-5">Page 2, with anchor</a><h5 id="heading-51">Hi</h5></body></html>`) };
        }), GoldsmithLinkCheckerError);
    },
});

Deno.test({
    name: "Broken link element",
    fn: async () => {
        await assertRejects(() => testWithBrokenLinkAsync((files, goldsmith) => {
            files["sources/link.html"] = { data: goldsmith.encodeUTF8(`<html><head><link rel="stylesheet" href="../css/tests.css" /></head><body>Nothing here</body></html>`) };
        }), GoldsmithLinkCheckerError);
    },
});

Deno.test({
    name: "Broken img element",
    fn: async () => {
        await assertRejects(() => testWithBrokenLinkAsync((files, goldsmith) => {
            files["sources/image.html"] = { data: goldsmith.encodeUTF8(`<html><body><img src="../asset/img.png"></body></html>`) };
        }), GoldsmithLinkCheckerError);
    },
});

Deno.test({
    name: "Broken img element (closed)",
    fn: async () => {
        await assertRejects(() => testWithBrokenLinkAsync((files, goldsmith) => {
            files["sources/imageClosed.html"] = { data: goldsmith.encodeUTF8(`<html><body><img src="assets/img.png"/></body></html>`) };
        }), GoldsmithLinkCheckerError);
    },
});

Deno.test({
    name: "Anchor without href",
    fn: async () => {
        await testWithBrokenLinkAsync((files, goldsmith) => {
            files["sources/bodyWithAnchorNoLink.html"] = { data: goldsmith.encodeUTF8(`<html><body><a id="no-link">No Link</a></body></html>`) };
        });
    },
});
