export function randArray<T>(array: T[]): T {
    const rand = Math.random() * array.length | 0
    return array[rand]
}