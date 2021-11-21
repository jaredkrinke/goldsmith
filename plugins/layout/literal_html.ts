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
    return (file, goldsmith) => {
        const layoutKey = file.layout ?? defaultTemplate;
        if (!layoutKey) {
            // File opted out of layouts
            return;
        } else {
            const layout = templates[layoutKey];
            if (!layout) {
                throw `Unknown layout: ${layoutKey} (available layouts: ${Object.keys(templates).join(", ")})`;
            }
    
            const source = goldsmith.decodeUTF8(file.data);
            const context = { ...goldsmith.metadata(), ...file };
            const result = layout(source, context);
            return result;
        }
    };
}
