import test from 'ava'
import { ModelParseError, Face } from '../../src/model'

test('valid', (t) => {
    t.true(
        Face.fromJson({
            texture: '#abc',
            uv: [1, 2, 3, 4],
            cullface: 'down',
            rotation: 90,
            tintindex: 12,
        }) instanceof Face,
    )
})

test('invalid type', (t) => {
    for (const it of [20, []] as any[]) {
        t.throws(() => Face.fromJson(it), {
            instanceOf: ModelParseError,
            message: 'Invalid face: ' + JSON.stringify(it),
        })
    }
})

test('invalid "texture"', (t) => {
    for (const texture of ['#', '', 'ab', 'abc'] as any[]) {
        t.throws(
            () =>
                Face.fromJson({
                    texture: texture,
                }),
            {
                instanceOf: ModelParseError,
                message: 'Invalid face texture: ' + JSON.stringify(texture),
            },
        )
    }
})

test('invalid "uv"', (t) => {
    t.throws(
        () =>
            Face.fromJson({
                texture: '#stone',
                uv: [1, 2, 3],
            }),
        {
            instanceOf: ModelParseError,
            message: 'Invalid Vec4: ' + JSON.stringify([1, 2, 3]),
        },
    )
})

test('invalid "cullface"', (t) => {
    t.throws(
        () =>
            Face.fromJson({
                texture: '#stone',
                cullface: 'nyet',
            }),
        {
            instanceOf: ModelParseError,
            message: 'Invalid face cullface: ' + JSON.stringify('nyet'),
        },
    )
})

test('invalid "rotation"', (t) => {
    t.throws(
        () =>
            Face.fromJson({
                texture: '#stone',
                rotation: 91,
            }),
        {
            instanceOf: ModelParseError,
            message: 'Invalid face rotation: ' + JSON.stringify(91),
        },
    )
})

test('invalid "tintindex"', (t) => {
    t.throws(
        () =>
            Face.fromJson({
                texture: '#stone',
                tintindex: 'abc',
            }),
        {
            instanceOf: ModelParseError,
            message: 'Invalid face tintindex: ' + JSON.stringify('abc'),
        },
    )
})
