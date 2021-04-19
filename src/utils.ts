export function isObject(o: any): o is Object {
    return typeof o === 'object' && Array.isArray(o) === false && o !== null
}

export function clamp(
    num: number,
    min = Number.MIN_VALUE,
    max = Number.MAX_VALUE,
) {
    return Math.min(Math.max(num, min), max)
}
