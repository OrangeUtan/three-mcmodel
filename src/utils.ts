export function isObject(o: any): o is Object {
    return typeof o === 'object' && Array.isArray(o) === false && o !== null
}
