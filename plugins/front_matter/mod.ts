import { GoldsmithPlugin } from "../../mod.ts";
import { parse as parseYAML } from "https://deno.land/std@0.113.0/encoding/_yaml/parse.ts";

export interface GoldsmithFrontMatterOptions {
    /** Only files matching this RegExp will be inspected for YAML front matter (default: `/\.md$/`). */
    pattern?: RegExp;
}

/** Goldsmith plugin for parsing YAML front matter (fenced by `---`) and adding it to the containing file's metadata. */
export function goldsmithFrontMatter(options?: GoldsmithFrontMatterOptions): GoldsmithPlugin {
    const pattern = options?.pattern ?? /\.md$/;
    const frontMatterPattern = /^---\r?\n(.*?)\r?\n---(\r?\n|$)/ms;
    return (files, goldsmith) => {
        for (const key of Object.keys(files)) {
            if (pattern.test(key)) {
                const file = files[key];
                const text = goldsmith.decodeUTF8(file.data);
                const matches = frontMatterPattern.exec(text);
                if (matches) {
                    const yamlText = matches[1];
                    let yaml: unknown;
                    try {
                        yaml = parseYAML(yamlText);
                    } catch (e) {
                        console.log(`Error parsing YAML front matter in "${key}"`);
                        throw e;
                    }

                    Object.assign(file, yaml);

                    const body = text.slice(matches[0].length);
                    file.data = goldsmith.encodeUTF8(body);
                }
            }
        }
    };
}
