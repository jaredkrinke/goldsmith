# goldsmithJSONMetadata()
Goldsmith plugin for reading global metadata from one or more JSON files.

This plugin can be used to, for example, read in a `site.json` JSON file and assign all the properties to a `site` property in Goldsmith's global metadata.

# API
## goldsmithJSONMetadata(stringOrMap)

Options can either be:

* A single string (indicating a single file name to read and then apply directly to global metadata)
* A map from JSON file names to the name of the key in global metadata that should receive the data (or an empty string, to apply directly to global metadata)

# Example
Given `site.json` in the input directory as follows:

```json
{
    "title": "My awesome site",
    "description": "A truly awesome site"
}
```

And this plugin configured as follows:

```typescript
await Goldsmith()
    .source("content")
    .destination("out")
    .use(goldsmithJSONMetadata({ "site.json": "site" }))
    .build();
```

Global metadata will be populated as follows:

