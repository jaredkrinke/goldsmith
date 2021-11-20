import { GoldsmithFile, GoldsmithPlugin } from "../../mod.ts";

declare module "../../mod.ts" {
    interface GoldsmithMetadata {
        indexes?: {
            [propertyName: string]: {
                [term: string]: GoldsmithFile[];
            };
        };
    }

    interface GoldsmithFile {
        term?: string;
        isTermIndex?: boolean;
    }
}

export interface GoldsmithIndexOptions {
    /** Only files matching this pattern will be used to generate the index. */
    pattern: RegExp;

    /** Name of the property over which the index should be created. */
    property: string;

    /** (Optional) Function that constructs the path to each index term's page. If not provided, pages will not be created for each term.
     * 
     * For example, if there should be a "category" page containing links to each post in the category, this could simply be: `` (term) => `categories/${term}.html` ``.
    */
    createTermIndexPath?: (term: string) => string;
}

/** Goldsmith plugin for creating an index (and, optionally, index pages for each unique term) over a single property on a set of files. */
export function goldsmithIndex(options: GoldsmithIndexOptions): GoldsmithPlugin {
    const { pattern, createTermIndexPath } = options;
    const propertyName = options.property;
    return (files, goldsmith) => {
        const index: { [term: string]: GoldsmithFile[] } = {};
        for (const key of Object.keys(files)) {
            if (pattern.test(key)) {
                const file = files[key];
                const termOrTerms = file[propertyName];
                const terms = Array.isArray(termOrTerms) ? termOrTerms : [termOrTerms];
                for (const term of terms) {
                    const list = index[term] ?? [];
                    index[term] = [...list, file];
                }
            }
        }

        goldsmith.metadata({
            indexes: { [propertyName]: index },
        });

        if (createTermIndexPath) {
            for (const term of Object.keys(index)) {
                files[createTermIndexPath(term)] = {
                    term,
                    isTermIndex: true,
                    data: new Uint8Array(0),
                };
            }
        }
    };
}
