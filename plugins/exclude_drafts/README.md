# goldsmithExcludeDrafts()
Trivial plugin to exclude files that have a `draft` property set to `true`.

This can be combined with the goldsmithFrontMatter plugin to exclude files based on `draft: true` appearing in a page's YAML front matter.

# API
## goldsmithExcludeDrafts(exclude: boolean)
* `exclude` (optional; default: true) indicates whether or not files with `draft` set to `true` should be excluded from output

# Example
Given a Markdown file `content/draft.md`:

```markdown
---
title: An example page
draft: true
---
# Upcoming post
TODO
```

And this plugin configured as follows, along with goldsmithFrontMatter (although you can use any plugin to attach `draft` metadata):

```typescript
import { Goldsmith } from "./path/to/goldsmith/mod.ts";
import { goldsmithExcludeDrafts } from "./path/to/exclude_drafts/mod.ts";
import { goldsmithFrontMatter } from "./path/to/front_matter/mod.ts";

await Goldsmith()
    .source("content")
    .destination("out")
    .use(goldsmithFrontMatter())
    .use(goldsmithExcludeDrafts())
    .build();
```

The `files` collection will be empty because `content/draft.md` has `draft: true` in its YAML front matter (and is thus excluded).
