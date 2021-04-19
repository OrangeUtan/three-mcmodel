import test from 'ava'

import { Element, ModelParseError } from '../../src/model'

test('valid', (t) => {
    t.true(
        Element.fromJson({
            from: [1, 1, 1],
            to: [2, 2, 2],
            faces: {},
            rotation: {
                origin: [1, 2, 3],
                angle: 22.5,
                axis: 'x',
            },
            shade: true,
        }) instanceof Element,
    )
})

test('invalid type', (t) => {
    for (const it of [20, []] as any[]) {
        t.throws(() => Element.fromJson(it), {
            instanceOf: ModelParseError,
            message: 'Invalid element: ' + JSON.stringify(it),
        })
    }
})

test('"from" is missing', (t) => {
    t.throws(
        () =>
            Element.fromJson({
                to: [1, 1, 1],
                faces: {},
            }),
        {
            instanceOf: ModelParseError,
            message: 'Element is missing property "from"',
        },
    )
})

test('"from" is invalid', (t) => {
    t.throws(
        () =>
            Element.fromJson({
                from: [1, 1, 1, 1, 1],
                to: [2, 2, 2],
                faces: {},
            }),
        { instanceOf: ModelParseError, message: 'Invalid Vec3: [1,1,1,1,1]' },
    )
})

test('"to" is missing', (t) => {
    t.throws(
        () =>
            Element.fromJson({
                from: [1, 1, 1],
                faces: {},
            }),
        {
            instanceOf: ModelParseError,
            message: 'Element is missing property "to"',
        },
    )
})

test('"to" is invalid', (t) => {
    t.throws(
        () =>
            Element.fromJson({
                from: [1, 1, 1],
                to: [2],
                faces: {},
            }),
        { instanceOf: ModelParseError, message: 'Invalid Vec3: [2]' },
    )
})

test('"faces" is missing', (t) => {
    t.throws(
        () =>
            Element.fromJson({
                from: [1, 1, 1],
                to: [2, 2, 2],
            }),
        {
            instanceOf: ModelParseError,
            message: 'Element is missing property "faces"',
        },
    )
})

test('"faces" has too many faces', (t) => {
    t.throws(
        () =>
            Element.fromJson({
                from: [1, 1, 1],
                to: [2, 2, 2],
                faces: {
                    west: {},
                    east: {},
                    down: {},
                    around: {},
                },
            }),
        {
            instanceOf: ModelParseError,
            message: 'Element has face with invalid name: "around"',
        },
    )
})

test('"shade" is invalid', (t) => {
    t.throws(
        () =>
            Element.fromJson({
                from: [1, 1, 1],
                to: [2, 2, 2],
                faces: {},
                shade: 2,
            }),
        { instanceOf: ModelParseError, message: 'Invalid property "shade": 2' },
    )
})
