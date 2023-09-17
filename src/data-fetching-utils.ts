export const normalizeGameName = (input: string): string => {
    const trimmedInput = input.trim()
    return trimmedInput
        .replace(/^\[\[(.*?)\]\]$/, "$1")
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/ /g, "-")
        .replace(/--/g, "-")
        .toLowerCase()
}

export const isStringTuple = (arr: any): arr is [string, string] => {
    return Array.isArray(arr) && arr.length === 2 && typeof arr[0] === "string" && typeof arr[1] === "string"
}
