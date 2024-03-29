import { GoldsmithFileCollection, GoldsmithPlugin } from "../../mod.ts";

declare module "../../mod.ts" {
    interface GoldsmithMetadata {
        __goldsmithServeInitialized?: boolean;
    }
}

export interface GoldsmithServeOptions {
    hostName?: string;
    port?: number;
    automaticReloading?: boolean;
}

const goldsmithServeEventPath = "/.goldsmithServe/events";
export function goldsmithServe(options?: GoldsmithServeOptions): GoldsmithPlugin {
    const port = options?.port ?? 8888;
    const hostname = options?.hostName ?? "localhost";
    const automaticReloading = options?.automaticReloading ?? true;
    const automaticReloadScript = `<script>(new WebSocket("ws://${hostname}:${port}${goldsmithServeEventPath}")).addEventListener("message", function (event) { window.location.reload(); });</script>`;
    const automaticReloadClients: WebSocket[] = [];
    const textDecoder = new TextDecoder();
    const textEncoder = new TextEncoder();

    const events = new EventTarget();
    let currentFiles: GoldsmithFileCollection | undefined;

    return (files, goldsmith) => {
        const isRebuild = !!currentFiles;
        currentFiles = files;

        if (!goldsmith.metadata().__goldsmithServeInitialized) {
            // Only start the server on the first build
            goldsmith.metadata().__goldsmithServeInitialized = true;

            // Register for build completion events, if needed
            if (automaticReloading) {
                events.addEventListener("rebuilt", function () {
                    for (const socket of automaticReloadClients) {
                        try {
                            socket.send("updated");
                        } catch (_e) {
                            // Ignore errors and assume client is no longer active
                        }
                    }

                    goldsmith.stopPerformanceSpan("Rebuild");
                });
            }

            // Start the server
            const server = Deno.listen({ hostname, port });
            console.log(`Serve: listening on: http://${hostname}:${port}/`);

            (async () => {
                for await (const connection of server) {
                    (async () => {
                        try {
                            const httpConnection = Deno.serveHttp(connection);
                            for await (const re of httpConnection) {
                                const url = new URL(re.request.url);
                                try {
                                    if (automaticReloading && url.pathname === goldsmithServeEventPath) {
                                        const { socket, response } = Deno.upgradeWebSocket(re.request);
                                        automaticReloadClients.push(socket);
                                        socket.addEventListener("close", () => {
                                            automaticReloadClients.splice(automaticReloadClients.indexOf(socket), 1);
                                        });
                                        await re.respondWith(response);
                                    } else {
                                        // Serve directly from memory
                                        const path = (url.pathname.endsWith("/") ? url.pathname + "index.html" : url.pathname).substring(1);
                                        let content = currentFiles[path].data;
    
                                        let insertedAutomaticReloadingScript = false;
                                        if (automaticReloading && path.endsWith(".html")) {
                                            // Insert reload script
                                            let text = textDecoder.decode(content);
                                            const index = text.lastIndexOf("</body>");
                                            if (index >= 0) {
                                                text = text.substr(0, index) + automaticReloadScript + text.substr(index);
                                            } else {
                                                text += automaticReloadScript;
                                            }
                                            content = textEncoder.encode(text);
                                            insertedAutomaticReloadingScript = true;
                                        }
    
                                        await re.respondWith(new Response(content, { status: 200 }));
                                        console.log(`  Serve: ${re.request.method} ${url.pathname} => ${path}${insertedAutomaticReloadingScript ? " (with auto-reload)" : ""}`);
                                    }
                                } catch (_e) {
                                    try {
                                        // Serve 404.html, if it exists
                                        const content = currentFiles["404.html"].data;
                                        await re.respondWith(new Response(content, { status: 404, headers: { "content-type": "text/html" } }));
                                    } catch (_e2) {
                                        // Otherwise serve a 404 with no content
                                        await re.respondWith(new Response("", { status: 404 }));
                                    }

                                    console.log(`  Serve: ${re.request.method} ${url.pathname} => (not found)`);
                                }
                            }
                        } catch (e) {
                            console.log(`  Serve: error: ${e}`);
                        }
                    })();
                }
            })();
        }

        // Trigger a reload as soon as this plugin is run since there's no need to wait for the files to be written to
        // the file system when we're serving directly from memory
        if (isRebuild) {
            events.dispatchEvent(new CustomEvent("rebuilt"));
        }
    };
}
