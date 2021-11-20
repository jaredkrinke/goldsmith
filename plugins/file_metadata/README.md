# goldsmithFileMetadata()
Goldsmith plugin for for adding metadata to files matching a pattern.

Optionally, the metadata can be dynamically computed using a callback.

# API
## goldsmithFileMetadata(options)
Options are as follows:

* `pattern: RegExp`: Only files matching this RegExp will have metadata added
* `metadata`: This can either be
  * An object with static metadata to uniformly add to each file
  * A callback with signature `(file: GoldsmithFile, matches: RegExpMatchArray, globalMetadata: GoldsmithMetadata)` that dynamically computes and returns the metadata to add for a specific file

# Example: static metadata
To add `draft: true` to all files in a `drafts/` directory:

```typescript
import { Goldsmith } from "./path/to/goldsmith/mod.ts";
import { goldsmithFileMetadata } from "./path/to/file_metadata/mod.ts";

await Goldsmith()
    .source("content")
    .destination("out")
    .use(goldsmithFileMetadata({
        pattern: /^drafts\//,
        metadata: { draft: true },
    }))
    .build();
```

# Example: dynamically computed metadata
To add a `category` property to each Markdown file based on the name of its parent directory (e.g. "topic1/post.md" would get `category: "topic1"` added to its metadata), a RegExp with groups can be used:

```regex
   /([^/]+)\/[^/]+\.md$/
```

This regular expression uses parentheses to capture a group that is before the file's final slash:

* `([^/]+)` is a group (group #1, i.e. `matches[1]`) that matches anything except slashes
* `\/` matches a slash: `/`
* `[^/]+` matches anything except slashes
* `\.md` matches `.md`
* `$` means the match must extend to the end of the string

Here's the full code:

```typescript
await Goldsmith()
    .source("content")
    .destination("out")
    .use(goldsmithFileMetadata({
        pattern: /([^/]+)\/[^/]+\.md$/,
        metadata: (_file, matches, _goldsmith) => ({
            category: matches[1],
        }),
    }))
    .build();
```
