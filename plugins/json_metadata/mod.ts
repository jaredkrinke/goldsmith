import { GoldsmithPlugin } from "../../mod.ts";

type GoldsmithJSONMetadataOptions = string | { [property: string]: string };

export function goldsmithJSONMetadata(stringOrOptions: GoldsmithJSONMetadataOptions): GoldsmithPlugin {
    const rows: { path: string, propertyName?: string }[] = [];
    if (typeof(stringOrOptions) === "string") {
        rows.push({ path: stringOrOptions });
    } else {
        const options = stringOrOptions;
        rows.push(...Object.keys(options).map(key => ({
            path: key,
            propertyName: options[key],
        })));
    }

    return (files, goldsmith) => {
        for (const { path, propertyName } of rows) {
            const file = files[path];
            delete files[path];
            const parsedObject = JSON.parse(goldsmith.decodeUTF8(file.data));
            if (propertyName) {
                goldsmith.metadata({ [propertyName]: parsedObject});
            } else {
                goldsmith.metadata(parsedObject);
            }
        }
    };
}
