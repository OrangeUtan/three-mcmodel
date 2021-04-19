import test from 'ava'
import { Display, ModelParseError } from '../../src/model'

test('valid', (t) => {
    t.true(
        Display.fromJson({
            rotation: [1, 2, 3],
            translation: [4, 5, 6],
            scale: [7, 8, 9],
        }) instanceof Display,
    )
})

test('invalid type', (t) => {
    for (const it of [20, []] as any[]) {
        t.throws(() => Display.fromJson(it), {
            instanceOf: ModelParseError,
            message: 'Invalid element display: ' + JSON.stringify(it),
        })
    }
})

test('"rotation" is invalid', (t) => {
    t.throws(
        () =>
            Display.fromJson({
                rotation: [1, 2],
            }),
        { instanceOf: ModelParseError, message: 'Invalid Vec3: [1,2]' },
    )
})

test('"translation" is invalid', (t) => {
    t.throws(
        () =>
            Display.fromJson({
                translation: [1, 2],
            }),
        { instanceOf: ModelParseError, message: 'Invalid Vec3: [1,2]' },
    )
})

test('"scale" is invalid', (t) => {
    t.throws(
        () =>
            Display.fromJson({
                scale: [1, 2],
            }),
        { instanceOf: ModelParseError, message: 'Invalid Vec3: [1,2]' },
    )
})
