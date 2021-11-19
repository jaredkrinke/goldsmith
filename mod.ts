import { posix } from "https://deno.land/std@0.113.0/path/mod.ts";

// Normalize to POSIX/web (forward) slashes
const { join, dirname } = posix;

/** Goldsmith's global metadata.
 * 
 * Plugins that add properties that are known at compile time should extend this definition to add all properties (as
 * optional properties), using declaration merging. Example:
 * 
 * ```typescript
 * declare module "./deps.ts" {
 *   interface GoldsmithMetadata {
 *     buildDate?: Date;
 *   }
 *}
 * ```
 * */
export interface GoldsmithMetadata {
    [propertyName: string]: unknown;
}

/** A file that will be written out by Goldsmith.
 * 
 * Plugins that add properties that are known at compile time should extend this definition to add all properties (as
 * optional properties), using declaration merging. Example:
 * 
 * ```typescript
 * declare module "./deps.ts" {
 *   interface GoldsmithFile {
 *     pathToRoot?: string;
 *   }
 *}
 * ```
 * */
 export interface GoldsmithFile {
    /** Content of the file */
    data: Uint8Array;

    [propertyName: string]: unknown;
}

/** A set of files, indexed by the file's path from the output root (note: always uses web-style forward slashes). */
export interface GoldsmithFileCollection {
    [filePath: string]: GoldsmithFile,
}

/** A plugin for Goldsmith. Plugins are synchronous or asynchronous functions that  can add/remove/transform files and also add/remove/manipulate global metadata.
 * 
 * Example: a plugin could transform *.md Markdown files to *.html files. */
export type GoldsmithPlugin = (files: GoldsmithFileCollection, goldsmith: GoldsmithObject) => (Promise<void> | void);

function isPromise<T>(value: void | Promise<T>): value is Promise<T> {
    return !!(value && value.then);
}

async function enumerateFiles(directoryName: string): Promise<string[]> {
    const filePaths: string[] = [];
    for await (const dirEntry of Deno.readDir(directoryName)) {
        const path = join(directoryName, dirEntry.name);
        if (dirEntry.isFile) {
            filePaths.push(path);
        } else if (dirEntry.isDirectory) {
            filePaths.push(...(await enumerateFiles(path)));
        }
    }
    return filePaths;
}

/** Goldsmith event that is fired when `build()` completes. */
export type GoldsmithEventType = "built";

/** Goldsmith event that is fired when `build()` completes. */
export class GoldsmithBuiltEvent extends Event {
    constructor() { super("built"); }
}

/** Goldsmith-specific error class */
export class GoldsmithError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "GoldsmithError";
    }
}

/** Goldsmith's fluent API for generating a static site, given an input directory, and a chain of plugins. */
class GoldsmithObject {
    properties: GoldsmithMetadata = {};
    cleanOutputDirectory = false;
    inputDirectory?: string;
    outputDirectory?: string;
    plugins: GoldsmithPlugin[] = [];
    events: EventTarget = new EventTarget();
    textEncoder = new TextEncoder();
    textDecoder = new TextDecoder();

    /** UTF-8 wrapper for TextEncoder.encode(), provided for convenience. */
    encodeUTF8(str: string): Uint8Array {
        return this.textEncoder.encode(str);
    }

    /** UTF-8 wrapper for TextEncoder.decode(), provided for convenience. */
    decodeUTF8(bytes: Uint8Array): string {
        return this.textDecoder.decode(bytes);
    }

    /** Get or merge metadata into Goldsmith's global metadata.
     * 
     * `metadata()` returns the current global metadata
     * `metadata({ key: value, ... }) merges properties into global metadata (and return GoldsmithObject for chaining)
     */
    metadata(properties: GoldsmithMetadata): GoldsmithObject;
    metadata(): GoldsmithMetadata;
    metadata(properties?: GoldsmithMetadata): GoldsmithObject | GoldsmithMetadata {
        if (properties) {
            Object.assign(this.properties, properties);
            return this;
        } else {
            return this.properties;
        }
    }

    /** Get or set the input directory for Goldsmith.
     * 
     * `source()` returns the current input directory
     * `source(directoryName)` sets the input directory (and return GoldsmithObject for chaining)
     */
    source(): string;
    source(directoryName: string): GoldsmithObject;
    source(directoryName?: string): GoldsmithObject | string {
        if (directoryName) {
            this.inputDirectory = directoryName;
            return this;
        } else {
            return this.inputDirectory ?? "";
        }
    }

    /** Get or set the output directory for Goldsmith.
     * 
     * `source()` returns the current output directory
     * `source(directoryName) sets the output directory (and return GoldsmithObject for chaining)
     */
    destination(): string;
    destination(directoryName: string): GoldsmithObject
    destination(directoryName?: string): GoldsmithObject | string {
        if (directoryName) {
            this.outputDirectory = directoryName;
            return this;
        } else {
            return this.outputDirectory ?? "";
        }
    }

    /** Tell Goldsmith to clear the output directory (or not) prior to writing out files (and return GoldsmithObject for chaining).
     * 
     * Note: files in the output directory that start with "." (e.g. ".git") are left alone.
    */
    clean(clean: boolean): GoldsmithObject {
        this.cleanOutputDirectory = clean;
        return this;
    }

    /** Add a plugin to Goldsmith's plugin chain (and return GoldsmithObject for chaining). */
    use(plugin: GoldsmithPlugin): GoldsmithObject {
        this.plugins.push(plugin);
        return this;
    }

    /** Read the input directory and execute the current sequence of plugins and return the (in-memory only) set of files that should be produced. This is especially useful for testing. */
    async run(): Promise<GoldsmithFileCollection> {
        // Read files
        const files: GoldsmithFileCollection = {};
        if (this.inputDirectory) {
            const inputDirectory = this.inputDirectory;
            const inputFilePaths = await enumerateFiles(inputDirectory);
            await Promise.all(inputFilePaths.map(async (path) => {
                // Note: path.relative requires access to current directory, so just use string manipulation here
                const pathFromInputDirectory = path.slice(inputDirectory.length + 1);
                files[pathFromInputDirectory] = { data: await Deno.readFile(path) };
            }));
        }

        // Process plugins
        for (const plugin of this.plugins) {
            const result = plugin(files, this);
            if (isPromise(result)) {
                await result;
            }
        }

        // Ensure file paths are valid
        const invalidPathPattern = /\.\.|\\|:|\/\//;
        for (const filePath of Object.keys(files)) {
            if (invalidPathPattern.test(filePath)) {
                throw new GoldsmithError(`Invalid file path in "files" collection: ${filePath}`);
            }
        }

        return files;
    }

    /** Read the input directory, execute the current sequence of plugins, clean the output directory (if requested), and write all produced files to the output directory. */
    async build(): Promise<void> {
        // Check options
        if (!this.outputDirectory) {
            throw new GoldsmithError("Output directory must be specified using: .destination(\"something\")");
        }

        // Clean, if requested
        const outputDirectory: string = this.outputDirectory;
        if (this.cleanOutputDirectory) {
            try {
                const tasks = [];
                for await (const dirEntry of Deno.readDir(outputDirectory)) {
                    // Ignore files that start with ".", e.g. ".git"
                    if (!dirEntry.name.startsWith(".")) {
                        tasks.push(Deno.remove(join(outputDirectory, dirEntry.name), { recursive: true }));
                    }
                }
                await Promise.all(tasks);
            } catch (e) {
                if (e instanceof Deno.errors.NotFound) {
                    // Nothing to cleanup
                } else {
                    throw e;
                }
            }
        }

        // Read files and process plugins
        const files = await this.run();

        // Output files by creating directories first and then writing files in parallel
        // TODO: Ensure there are no ".." in the paths (and add corresponding test)
        await Deno.mkdir(outputDirectory, { recursive: true });
        for (const key of Object.keys(files)) {
            const dir = join(outputDirectory, dirname(key));
            await Deno.mkdir(dir, { recursive: true });
        }

        await Promise.all(Object.keys(files).map(key => Deno.writeFile(join(outputDirectory, key), files[key].data)));

        // Signal completion
        this.events.dispatchEvent(new GoldsmithBuiltEvent());
    }

    /** Add an event listener to Goldsmith (currently, only the "built" event is supported). */
    addEventListener(type: GoldsmithEventType, listener: (event: GoldsmithBuiltEvent) => void): void {
        this.events.addEventListener(type, listener);
    }

    /** Remove an event listener from Goldsmith. */
    removeEventListener(type: GoldsmithEventType, listener: (event: GoldsmithBuiltEvent) => void): void {
        this.events.removeEventListener(type, listener);
    }
}

/** Initialize Goldsmith and return GoldsmithObject for using its fluent/chain-based API. */
export const Goldsmith = () => new GoldsmithObject();
