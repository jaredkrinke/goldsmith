# goldsmithFrontMatter()
Goldsmith plugin for parsing [YAML](https://en.wikipedia.org/wiki/YAML) front matter (fenced by `---`) and adding it to the containing file's metadata.

This can be used to read title, date, keyword, etc. metadata from the beginning of Markdown pages, for example.

# API
## goldsmithFrontMatter(options)
The options object is optional and can have the following properties:

* `pattern: RegExp`: Only files matching this RegExp will be inspected for YAML front matter (default: `/\.md$/`)

# Example
Given a Markdown file `content/page.md`:

```markdown
---
title: An example page
date: 2021-11-19
keywords: [goldsmith,yaml]
---
# Heading
This is just normal Markdown content here.
```

And this plugin configured as follows:

```typescript
await Goldsmith()
    .source("content")
    .destination("out")
    .use(goldsmithFrontMatter()) // Note: default pattern is /\.md$/ (i.e. "*.md")
    .build();
```

The `files` collection will look like this:

```typescript
{
  "page.md": {
    title: "An example page",
    date: 2021-11-19T00:00:00.000Z,
    keywords: [ "goldsmith", "yaml" ],
    data: ...
  }
}
```
