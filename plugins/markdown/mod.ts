import { GoldsmithPlugin } from "../../mod.ts";
// @deno-types="./deps/index.d.ts"
import { marked, Renderer } from "./deps/marked.esm.js";

export interface goldsmithMarkdownOptions {
    replaceLinks?: (link: string) => string;
    highlight?: (code: string, language: string) => string;
}

const markdownPattern = /(.+)\.md$/;
export function goldsmithMarkdown(options?: goldsmithMarkdownOptions): GoldsmithPlugin {
    const replaceLinks = options?.replaceLinks;
    const highlight = options?.highlight;
    return (files, goldsmith) => {
        marked.setOptions(marked.getDefaults());
        if (replaceLinks) {
            const renderer = new Renderer();
            const base = renderer.link;
            renderer.link = function (href: string, title: string, text: string) {
                return base.call(this, replaceLinks(href), title, text);
            };
            marked.use({ renderer });
        }

        if (highlight) {
            marked.use({ highlight });
        }

        for (const key of Object.keys(files)) {
            const matches = markdownPattern.exec(key);
            if (matches) {
                const file = files[key];
                const markdown = goldsmith.decodeUTF8(file.data);
                const html = marked(markdown);
                file.data = goldsmith.encodeUTF8(html);
                delete files[key];
                files[`${matches[1]}.html`] = file;
            }
        }
    };
}
