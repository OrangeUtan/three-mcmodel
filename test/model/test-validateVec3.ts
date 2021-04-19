import test from 'ava'

import * as model from '../../src/model'

test('valid', (t) => {
    t.true(model.validateVec3([1, 2, 3]))
})

test('invalid type', (t) => {
    for (const vec of [{}, '[1, 2, 3]']) {
        t.throws(() => model.validateVec3(vec), {
            instanceOf: model.ModelParseError,
            message: 'Invalid Vec3: ' + JSON.stringify(vec),
        })
    }
})

test('invalid element count', (t) => {
    for (const vec of [[], [1], [1, 2], [1, 2, 3, 4]]) {
        t.throws(() => model.validateVec3(vec), {
            instanceOf: model.ModelParseError,
            message: 'Invalid Vec3: ' + JSON.stringify(vec),
        })
    }
})

test('invalid elements', (t) => {
    for (const vec of [
        [1, 1, '1'],
        [1, false, 1],
    ]) {
        t.throws(() => model.validateVec3(vec), {
            instanceOf: model.ModelParseError,
            message: 'Invalid Vec3: ' + JSON.stringify(vec),
        })
    }
})
