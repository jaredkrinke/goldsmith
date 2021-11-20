# goldsmithLogMetadata()
A trivial plugin for logging Goldsmith's global and per-file metadata to the console during a build.

Debugging a build live is usually a better option, but this plugin can be helpful for diffing output between two different runs, for example.

# API
```typescript
import { Goldsmith } from "./path/to/goldsmith/mod.ts";
import { goldsmithLogMetadata } from "./path/to/log_metadata/mod.ts";

await Goldsmith()
    ... // Other plugins go here
    .use(goldsmithLogMetadata())
    .build();
```
