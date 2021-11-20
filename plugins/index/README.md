# goldsmithIndex()
Goldsmith plugin for creating an index (and, optionally, index pages for each unique term) over a specific property on a set of files.

This can be used, for example, to create pages for every unique keyword/tag/category specified on the pages of the web site. These "term index" pages can then link back to their associated pages.

# API
## goldsmithIndex(options)
The options object has the following properties:

* `pattern: RegExp`: Only files matching this pattern will be used to generate the index
* `property: string`: Name of the property over which the index should be created (e.g. "keywords")
  * Note: The property can either be a single string or an array of strings (e.g. for pages with multiple keywords)
* `createTermIndexPath?: (term: string) => string`: (Optional) Function that constructs the path to each index term's page
  * If not provided, pages will not be created for each term
  * For example, if there should be a "category" page containing links to each post in the category, this could simply be: `` (term) => `categories/${term}.html` ``
  * Term index pages will have two special properties set:
    * `term`: The term for the page
    * `isTermIndex: true`: A property to indicate that this is a term index page

In addition to creating pages, this plugin will also add the index to global metadata. For example, if the property name is "keywords", then the following global metadata will be set:

```typescript
{
  indexes: {
    keywords: {
      "keyword1": // array of GoldsmithFiles with that keyword
      "keyword2": // etc.
    }
  }
}
```

# Example
For this example, the goldsmithFrontMatter plugin will be used to parse keywords (in YAML format) associated with the following Markdown files:

content/post1.md:
```markdown
---
title: A post about both Goldsmith and YAML
keywords: [goldsmith,yaml]
---
# Heading
This post is about both Goldsmith and YAML.
```

And two more Markdown files with the following titles and keywords, using the same format as above:

| `title` | `keywords` |
|---|---|
| `A post about only Goldsmith` | `[goldsmith]` |
| `A post about only YAML` | `[yaml]` |

Now, with this plugin configured as follows:

```typescript
import { Goldsmith } from "./path/to/goldsmith/mod.ts";
import { goldsmithFrontMatter } from "./path/to/front_matter/mod.ts";
import { goldsmithIndex } from "./path/to/index/mod.ts";

const pattern = /\.md$/;

await Goldsmith()
    .source("content")
    .destination("out")
    .use(goldsmithFrontMatter({ pattern }))
    .use(goldsmithIndex({
        pattern,
        property: "keywords",
        createTermIndexPath: term => `index_${term}.html`,
    }))
    .use((files, goldsmith) => {
        // For logging/demonstration purposes only
        for (const [path, file] of Object.entries(files)) {
            const globalMetadata = goldsmith.metadata();
            if (file.isTermIndex) {
                console.log(`\nTerm index ${path}`);
                console.log(`Term=${file.term}`);
                console.log(`Titles: ${globalMetadata.indexes!.keywords[file.term!].map(f => f.title).join(", ")}`);
            }
        }
    })
    .build();
```

The logging plugin will output the following (showing two term index pages, one for each unique term, along with the associated file titles):

```
Term index index_goldsmith.html
Term=goldsmith
Titles: A post about both Goldsmith and YAML, A post about only Goldsmith

Term index index_yaml.html
Term=yaml
Titles: A post about both Goldsmith and YAML, A post about only YAML
```
