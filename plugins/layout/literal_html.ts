import type { GoldsmithFile, GoldsmithMetadata } from "../../mod.ts";
import type { GoldsmithLayoutCallback } from "./mod.ts";

export type GoldsmithLiteralHTMLLayoutContext = GoldsmithMetadata & GoldsmithFile;

export type GoldsmithLiteralHTMLLayoutCallback = (content: string, metadata: GoldsmithLiteralHTMLLayoutContext) => string;
export type GoldsmithLiteralHTMLLayoutMap = {
    [name: string]: GoldsmithLiteralHTMLLayoutCallback;
};

export interface GoldsmithLiteralHTMLOptions {
    templates: GoldsmithLiteralHTMLLayoutMap;
    defaultTemplate?: string;
}

export function goldsmithLayoutLiteralHTML(options: GoldsmithLiteralHTMLOptions): GoldsmithLayoutCallback {
    const { templates, defaultTemplate } = options;
    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();
    return (file, metadata) => {
        const layoutKey = file.layout ?? defaultTemplate;
        if (!layoutKey) {
            // File opted out of layouts
            return file.data;
        } else {
            const layout = templates[layoutKey];
            if (!layout) {
                throw `Unknown layout: ${layoutKey} (available layouts: ${Object.keys(templates).join(", ")})`;
            }
    
            const source = textDecoder.decode(file.data);
            const context = { ...metadata, ...file };
            const result = layout(source, context);
            return textEncoder.encode(result);
        }
    };
}
