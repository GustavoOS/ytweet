export function isLocal(dbUrl: string) {
    const url = new URL(dbUrl);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
}
