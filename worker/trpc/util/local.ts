const acceptableHostnames = new Set(["localhost", "127.0.0.1"]);

export function isLocal(dbUrl: string) {
    const url = new URL(dbUrl);
    return acceptableHostnames.has(url.hostname);
}
