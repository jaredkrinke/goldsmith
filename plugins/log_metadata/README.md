# goldsmithLogMetadata()
A trivial plugin for logging Goldsmith's global and per-file metadata to the console during a build.

Debugging a build live is usually a better option, but this plugin can be helpful for diffing output between two different runs, for example.

# API
```typescript
await Goldsmith()
    ... // Other plugins go here
    .use(goldsmithLogMetadata())
    .build();
```
