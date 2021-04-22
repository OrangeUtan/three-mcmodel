export function isObject(o: any): o is Object {
    return typeof o === 'object' && Array.isArray(o) === false && o !== null
}

export function gcd(a: number, b: number): number {
    while(a != b) {
        if(a > b) {
            a -= b;
        } else {
            b -= a;
        }
    }
    return b;
}

export function lcm(a: number, b: number): number {
    return (a*b) / gcd(a, b);
}