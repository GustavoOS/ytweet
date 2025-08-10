export function nameInitialsFromName(name: string) {
    const names = name.toUpperCase().split(" ");
    if (names.length === 1) {
        return names[0].charAt(0).toUpperCase();
    }
    return names[0].charAt(0).toUpperCase() + names.at(-1)!.charAt(0).toUpperCase();
}
