import type { GoldsmithPlugin } from "../../mod.ts";
// @deno-types="./deps/html_tokenizer.d.ts"
import { Parser } from "./deps/html_tokenizer.js";

export interface BrokenLink {
    filePath: string;
    href: string;
}

export class GoldsmithLinkCheckerError extends Error {
    brokenLinks: BrokenLink[] = [];

    constructor(brokenLinks: BrokenLink[]) {
        super(`The site has broken relative links:\n\n${brokenLinks.map(bl => `From "${bl.filePath}" to "${bl.href}"`).join("\n")}`);
        this.brokenLinks = brokenLinks;
    }
}

function pathUp(path: string): string {
    const lastIndexOfSlash = path.lastIndexOf("/");
    if (lastIndexOfSlash < 0) {
        throw "Tried to go up one level from a root path!";
    }

    return path.substr(0, lastIndexOfSlash)
}

function pathRelativeResolve(from: string, to: string): string {
    let currentPath = pathUp("/" + from);
    for (const part of to.split("/")) {
        switch (part) {
            case ".":
                break;
            
            case "..":
                currentPath = pathUp(currentPath);
                break;
            
            default:
                currentPath = currentPath + "/" + part;
                break;
        }
    }
    return currentPath.slice(1);
}

const relativeLinkPattern = /^[^/][^:]*$/;
export function goldsmithLinkChecker(): GoldsmithPlugin {
    const pattern = /^.+\.html$/; // TODO: Make customizable?
    return (files, goldsmith) => {
        // Create a map of files to ids
        const fileToIds: { [filePath: string]: Set<string> } = {};
        for (const [filePath, file] of Object.entries(files)) {
            if (pattern.test(filePath)) {
                const html = goldsmith.decodeUTF8(file.data);
                const ids = new Set<string>();
                for (const token of Parser.parse(html)) {
                    switch (token.type) {
                        case 'open': {
                            const id = token.attributes.id;
                            if (id) {
                                ids.add(id);
                            }
                        }
                        break;
                    }
                }
                fileToIds[filePath] = ids;
            }
        }

        // Accumulate a list of broken links
        const brokenLinks: BrokenLink[] = [];
        const tagToLinkAttribute: { [tagName:string]: string } = {
            a: "href",
            link: "href",
            img: "src",
        };
        
        for (const sourcePath of Object.keys(files)) {
            if (pattern.test(sourcePath)) {
                const sourceHTML = goldsmith.decodeUTF8(files[sourcePath].data);
                for (const token of Parser.parse(sourceHTML)) {
                    switch (token.type) {
                        case 'open': {
                            const attributeName = tagToLinkAttribute[token.name];
                            if (attributeName) {
                                const href = token.attributes[attributeName];
                                if (relativeLinkPattern.test(href)) {
                                    const targetParts = href.split("#");
                                    if (targetParts.length > 2) {
                                        throw `Invalid link: "${href}"`;
                                    }
            
                                    const targetPath = targetParts[0];
                                    const targetId = targetParts[1];
            
                                    // Check that link target exists, if provided
                                    let broken = false;
                                    let targetPathFromRoot;
                                    if (targetPath) {
                                        targetPathFromRoot = pathRelativeResolve(sourcePath, targetPath);
                                        if (!files[targetPathFromRoot]) {
                                            broken = true;
                                        }
                                    }
            
                                    // Check that the id exists, if provided
                                    if (!broken && targetId) {
                                        const targetIds = targetPathFromRoot
                                            ? fileToIds[targetPathFromRoot]
                                            : fileToIds[sourcePath];
            
                                        // TODO: Validate id format first
                                        if (!targetIds.has(targetId)) {
                                            broken = true;
                                        }
                                    }
            
                                    if (broken) {
                                        brokenLinks.push({ filePath: sourcePath, href });
                                    }
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }

        if (brokenLinks.length > 0) {
            throw new GoldsmithLinkCheckerError(brokenLinks);
        }
    };
}
