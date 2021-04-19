import test from 'ava'

import { ModelParseError, MinecraftModel } from '../../src/model'

test('valid', (t) => {
    t.true(
        MinecraftModel.fromJson({
            textures: {
                'block/stone': 'somePath',
            },
            elements: [
                {
                    from: [1, 1, 1],
                    to: [2, 2, 2],
                    faces: {},
                },
            ],
            display: {
                gui: {
                    rotation: [1, 2, 3],
                },
            },
        }) instanceof MinecraftModel,
    )
})

test('invalid type', (t) => {
    for (const it of [20, []] as any[]) {
        t.throws(() => MinecraftModel.fromJson(it), {
            instanceOf: ModelParseError,
            message: 'Invalid model: ' + JSON.stringify(it),
        })
    }
})

test('missing "textures"', (t) => {
    t.notThrows(() =>
        MinecraftModel.fromJson({
            elements: [],
        }),
    )
})

test('invalid "textures"', (t) => {
    for (const textures of [20, [], { a: 999 }]) {
        t.throws(
            () =>
                MinecraftModel.fromJson({
                    textures,
                    elements: [],
                }),
            {
                instanceOf: ModelParseError,
                message:
                    'Invalid property "textures": ' + JSON.stringify(textures),
            },
        )
    }
})

test('invalid "parent"', (t) => {
    t.throws(
        () =>
            MinecraftModel.fromJson({
                textures: {
                    'block/stone': 'somePath',
                },
                elements: [],
                parent: 20,
            }),
        {
            instanceOf: ModelParseError,
            message: 'Invalid property "parent": 20',
        },
    )
})

test('invalid "elements"', (t) => {
    t.throws(
        () =>
            MinecraftModel.fromJson({
                textures: {
                    'block/stone': 'somePath',
                },
                elements: true,
            }),
        {
            instanceOf: ModelParseError,
            message: 'Invalid property "elements": true',
        },
    )
})

test('invalid "ambientocclusion"', (t) => {
    t.throws(
        () =>
            MinecraftModel.fromJson({
                textures: {
                    'block/stone': 'somePath',
                },
                elements: [],
                ambientocclusion: 'a string',
            }),
        {
            instanceOf: ModelParseError,
            message: 'Invalid property "ambientocclusion": "a string"',
        },
    )
})

test('invalid "display"', (t) => {
    for (const display of [20, []]) {
        t.throws(
            () =>
                MinecraftModel.fromJson({
                    textures: {
                        'block/stone': 'somePath',
                    },
                    elements: [],
                    display,
                }),
            {
                instanceOf: ModelParseError,
                message:
                    'Invalid property "display": ' + JSON.stringify(display),
            },
        )
    }
})

test('unknown "display" type', (t) => {
    t.throws(
        () =>
            MinecraftModel.fromJson({
                textures: {
                    'block/stone': 'somePath',
                },
                elements: [],
                display: {
                    gui: {},
                    head: {},
                    down_under: {},
                },
            }),
        {
            instanceOf: ModelParseError,
            message: 'Unknown display type: "down_under"',
        },
    )
})
