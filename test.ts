import { Goldsmith } from "./mod.ts";

await Goldsmith()
    .source("content")
    .destination("out")
    .clean(true)
    .build();
