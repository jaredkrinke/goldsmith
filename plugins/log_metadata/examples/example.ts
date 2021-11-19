import { Goldsmith } from "../../../mod.ts";
import { goldsmithLogMetadata } from "../mod.ts";

await Goldsmith()
    .use((files, goldsmith) => {
        goldsmith.metadata({
            site: { title: "Great site" },
        });

        files["test.txt"] = {
            date: new Date(),
            data: goldsmith.encodeUTF8("Hi"),
        };
    })
    .use(goldsmithLogMetadata())
    .run(); // Note: Normally, `build()` would be used to write to disk, along with `destination(path)` (to specify an output directory)
