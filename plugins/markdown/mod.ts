import { GoldsmithPlugin } from "../../mod.ts";
// @deno-types="./deps/index.d.ts"
import { marked, Renderer } from "./deps/marked.esm.js";

export interface goldsmithMarkdownOptions {
    replaceLinks?: (link: string) => string;
    highlight?: (code: string, language: string) => string;
    cache?: boolean;
}

interface CacheEntry {
    input: string;
    output: string;
}

type Cache = { [id: string]: CacheEntry };

const markdownPattern = /(.+)\.md$/;
export function goldsmithMarkdown(options?: goldsmithMarkdownOptions): GoldsmithPlugin {
    const replaceLinks = options?.replaceLinks;
    const highlight = options?.highlight;
    const cache: Cache | undefined = (options?.cache) ? {} : undefined;
    return function markdown (files, goldsmith) {
        marked.setOptions({
            ...marked.getDefaults(),
            mangle: false, // Prefer consistent output over dubious privacy features
        });

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

                // If caching is enabled, check to see if there's an entry with identical input
                const cacheEntry = cache?.[key];
                const cached = (cacheEntry && cacheEntry.input === markdown);
                const cachedHtml = cached ? cacheEntry.output : undefined;

                const html = cachedHtml ?? marked(markdown);

                // If caching is enabled but this entry was *not* cached, add to (or update) the cache
                if (cache && !cached) {
                    cache[key] = {
                        input: markdown,
                        output: html,
                    };
                }

                file.data = goldsmith.encodeUTF8(html);
                delete files[key];
                files[`${matches[1]}.html`] = file;
            }
        }
    };
}
