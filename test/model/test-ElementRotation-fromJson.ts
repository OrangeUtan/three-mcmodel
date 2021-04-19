import test from 'ava'

import { ElementRotation, ModelParseError } from '../../src/model'

test('valid', (t) => {
    t.true(
        ElementRotation.fromJson({
            origin: [1, 1, 1],
            angle: 22.5,
            axis: 'x',
            rescale: false,
        }) instanceof ElementRotation,
    )
})

test('invalid type', (t) => {
    for (const it of [20, []] as any[]) {
        t.throws(() => ElementRotation.fromJson(it), {
            instanceOf: ModelParseError,
            message: 'Invalid element rotation: ' + JSON.stringify(it),
        })
    }
})

test('missing "origin"', (t) => {
    t.throws(
        () =>
            ElementRotation.fromJson({
                angle: 22.5,
                axis: 'x',
            }),
        {
            instanceOf: ModelParseError,
            message: 'Element rotation is missing property "origin"',
        },
    )
})

test('missing "axis"', (t) => {
    t.throws(
        () =>
            ElementRotation.fromJson({
                origin: [1, 1, 1],
                angle: 22.5,
            }),
        {
            instanceOf: ModelParseError,
            message: 'Element rotation is missing property "axis"',
        },
    )
})

test('missing "angle"', (t) => {
    t.throws(
        () =>
            ElementRotation.fromJson({
                origin: [1, 1, 1],
                axis: 'x',
            }),
        {
            instanceOf: ModelParseError,
            message: 'Element rotation is missing property "angle"',
        },
    )
})

test('invalid "origin"', (t) => {
    t.throws(
        () =>
            ElementRotation.fromJson({
                origin: [1, 1],
                angle: 22.5,
                axis: 'y',
            }),
        { instanceOf: ModelParseError, message: 'Invalid Vec3: [1,1]' },
    )
})

test('invalid "angle"', (t) => {
    t.throws(
        () =>
            ElementRotation.fromJson({
                origin: [1, 1, 1],
                angle: 10,
                axis: 'y',
            }),
        {
            instanceOf: ModelParseError,
            message: 'Invalid element rotation angle: 10',
        },
    )
})

test('invalid "axis"', (t) => {
    t.throws(
        () =>
            ElementRotation.fromJson({
                origin: [1, 1, 1],
                angle: 22.5,
                axis: 'a',
            }),
        {
            instanceOf: ModelParseError,
            message: 'Invalid element rotation axis: "a"',
        },
    )
})

test('invalid "rescale"', (t) => {
    t.throws(
        () =>
            ElementRotation.fromJson({
                origin: [1, 1, 1],
                angle: 22.5,
                axis: 'x',
                rescale: 3,
            }),
        {
            instanceOf: ModelParseError,
            message: 'Invalid element rotation property "rescale": 3',
        },
    )
})
