// Types for minecraft json models (see https://minecraft.fandom.com/wiki/Model)

import { isObject, clamp } from './utils'

export class ModelParseError extends Error {
    constructor(msg?: string) {
        super(msg)
        Object.setPrototypeOf(this, new.target.prototype)
        this.name = ModelParseError.name
    }
}

export type Vec3 = [number, number, number]
export function validateVec3(vec: any): vec is Vec3 {
    if (
        Array.isArray(vec) &&
        vec.length === 3 &&
        vec.every((coord) => typeof coord === 'number')
    ) {
        return true
    } else {
        throw new ModelParseError('Invalid Vec3: ' + JSON.stringify(vec))
    }
}

export type Vec4 = [number, number, number, number]
export function validateVec4(vec: any): vec is Vec4 {
    if (
        Array.isArray(vec) &&
        vec.length === 4 &&
        vec.every((coord) => typeof coord === 'number')
    ) {
        return true
    } else {
        throw new ModelParseError('Invalid Vec4: ' + JSON.stringify(vec))
    }
}

export enum FaceType {
    WEST = 'west',
    EAST = 'east',
    DOWN = 'down',
    UP = 'up',
    NORTH = 'north',
    SOUTH = 'south',
}

export type TextureRotationAngle = 0 | 90 | 180 | 270

export class Face {
    public rotation: TextureRotationAngle

    constructor(
        public texture: string,
        public uv?: Vec4,
        public cullface?: FaceType,
        rotation?: TextureRotationAngle,
        public tintindex?: number,
    ) {
        this.rotation = rotation ?? 0
    }

    static fromJson(json: any) {
        if (!isObject(json)) {
            throw new ModelParseError('Invalid face: ' + JSON.stringify(json))
        }

        if (json.texture != null) {
            if (
                typeof json.texture !== 'string' ||
                json.texture.length < 2 ||
                json.texture[0] !== '#'
            ) {
                throw new ModelParseError(
                    'Invalid face texture: ' + JSON.stringify(json.texture),
                )
            }
        }

        if (json.uv != null) {
            validateVec4(json.uv)
        }

        if (
            json.cullface != null &&
            !Object.values(FaceType).includes(json.cullface)
        ) {
            throw new ModelParseError(
                'Invalid face cullface: ' + JSON.stringify(json.cullface),
            )
        }

        if (
            json.rotation != null &&
            ![0, 90, 180, 270].includes(json.rotation)
        ) {
            throw new ModelParseError(
                'Invalid face rotation: ' + JSON.stringify(json.rotation),
            )
        }

        if (json.tintindex != null && typeof json.tintindex !== 'number') {
            throw new ModelParseError(
                'Invalid face tintindex: ' + JSON.stringify(json.tintindex),
            )
        }

        return new Face(
            json.texture,
            json.uv,
            json.cullface,
            json.rotation,
            json.tintindex,
        )
    }
}

export enum DisplayPosition {
    GUI = 'gui',
    HEAD = 'head',
    GROUND = 'ground',
    FIXED = 'fixed',
    THIRDPERSON_RIGHTHAND = 'thirdperson_righthand',
    THIRDPERSON_LEFTHAND = 'thirdperson_lefthand',
    FIRSTPERSON_RIGHTHAND = 'firstperson_righthand',
    FIRSTPERSON_LEFTHAND = 'firstperson_lefthand',
}

export class Display {
    public rotation: Vec3
    public translation: Vec3
    public scale: Vec3

    constructor(rotation?: Vec3, translation?: Vec3, scale?: Vec3) {
        this.rotation = rotation ?? [0, 0, 0]
        this.translation = (translation?.map((n) =>
            clamp(n, -80, 80),
        ) as Vec3) ?? [0, 0, 0]
        this.scale = (scale?.map((n) => clamp(n, 0, 4)) as Vec3) ?? [1, 1, 1]
    }

    static fromJson(json: any) {
        if (!isObject(json)) {
            throw new ModelParseError(
                'Invalid element display: ' + JSON.stringify(json),
            )
        }

        if (json.rotation != null) {
            validateVec3(json.rotation)
        }
        if (json.translation != null) {
            validateVec3(json.translation)
        }
        if (json.scale != null) {
            validateVec3(json.scale)
        }

        return new Display(json.rotation, json.translation, json.scale)
    }
}

export type ElementRotationAngle = -45 | -22.5 | 0 | 22.5 | 45

export enum RotationAxis {
    X = 'x',
    Y = 'y',
    Z = 'z',
}

export class ElementRotation {
    public rescale: boolean

    constructor(
        public origin: Vec3,
        public angle: number,
        public axis: RotationAxis,
        rescale?: boolean,
    ) {
        this.rescale = rescale ?? false
    }

    static fromJson(json: any) {
        if (!isObject(json)) {
            throw new ModelParseError(
                'Invalid element rotation: ' + JSON.stringify(json),
            )
        }

        for (const prop of ['origin', 'angle', 'axis']) {
            if (!(prop in json)) {
                throw new ModelParseError(
                    `Element rotation is missing property "${prop}"`,
                )
            }
        }

        validateVec3(json.origin)

        if (![-45, -22.5, 0, 22.5, 45].includes(json.angle)) {
            throw new ModelParseError(
                'Invalid element rotation angle: ' + JSON.stringify(json.angle),
            )
        }

        if (!Object.values(RotationAxis).includes(json.axis)) {
            throw new ModelParseError(
                'Invalid element rotation axis: ' + JSON.stringify(json.axis),
            )
        }

        if (json.rescale != null && typeof json.rescale !== 'boolean') {
            throw new ModelParseError(
                'Invalid element rotation property "rescale": ' +
                    JSON.stringify(json.rescale),
            )
        }

        return new ElementRotation(
            json.origin,
            json.angle,
            json.axis,
            json.rescale,
        )
    }
}

export class Element {
    public shade: boolean

    constructor(
        public from: Vec3,
        public to: Vec3,
        public faces: { [name in FaceType]?: Face },
        public rotation?: ElementRotation,
        shade?: boolean,
    ) {
        this.shade = shade ?? true
    }

    static fromJson(json: any) {
        if (!isObject(json)) {
            throw new ModelParseError(
                'Invalid element: ' + JSON.stringify(json),
            )
        }

        for (const prop of ['from', 'to']) {
            if (!(prop in json)) {
                throw new ModelParseError(
                    `Element is missing property "${prop}"`,
                )
            }
        }

        validateVec3(json.from)
        validateVec3(json.to)

        let faces: { [name in FaceType]?: Face } | undefined = undefined
        if (json.faces == null) {
            throw new ModelParseError('Element is missing property "faces"')
        } else {
            const faceNames = Object.values(FaceType) as string[]
            for (const face of Object.keys(json.faces)) {
                if (!faceNames.includes(face)) {
                    throw new ModelParseError(
                        'Element has face with invalid name: ' +
                            JSON.stringify(face),
                    )
                }
            }

            faces = {}
            for (const name in json.faces) {
                faces[name as FaceType] = Face.fromJson(json.faces[name])
            }
        }

        const rotation = json.rotation
            ? ElementRotation.fromJson(json.rotation)
            : undefined

        if (json.shade != null && typeof json.shade !== 'boolean') {
            throw new ModelParseError(
                'Invalid property "shade": ' + JSON.stringify(json.shade),
            )
        }

        return new Element(json.from, json.to, json.faces, rotation, json.shade)
    }
}

export class MinecraftModel {
    public ambientocclusion: boolean

    constructor(
        public parent?: string,
        public textures?: { [name: string]: string },
        public elements?: Element[],
        public display?: { [name in DisplayPosition]?: Display },
        ambientocclusion?: boolean,
    ) {
        this.ambientocclusion = ambientocclusion ?? true
    }

    static fromJson(json: any) {
        if (!isObject(json)) {
            throw new ModelParseError('Invalid model: ' + JSON.stringify(json))
        }

        if (json.parent != null && typeof json.parent !== 'string') {
            throw new ModelParseError(
                'Invalid property "parent": ' + JSON.stringify(json.parent),
            )
        }

        if (json.textures != null) {
            if (
                !isObject(json.textures) ||
                !Object.entries(json.textures).every(
                    ([name, texture]) =>
                        typeof name === 'string' && typeof texture === 'string',
                )
            ) {
                throw new ModelParseError(
                    'Invalid property "textures": ' +
                        JSON.stringify(json.textures),
                )
            }
        }

        let elements: Element[] | undefined = undefined
        if (json.elements != null) {
            if (!Array.isArray(json.elements)) {
                throw new ModelParseError(
                    'Invalid property "elements": ' +
                        JSON.stringify(json.elements),
                )
            }
            elements = json.elements.map((elem: any) => Element.fromJson(elem))
        }

        let displayPositions:
            | { [name in DisplayPosition]?: Display }
            | undefined = undefined
        if (json.display != null) {
            if (!isObject(json.display)) {
                throw new ModelParseError(
                    'Invalid property "display": ' +
                        JSON.stringify(json.display),
                )
            }

            const positions = Object.values(DisplayPosition) as string[]
            for (const position of Object.keys(json.display)) {
                if (!positions.includes(position)) {
                    throw new ModelParseError(
                        'Unknown display type: ' + JSON.stringify(position),
                    )
                }
            }

            displayPositions = {}
            for (const pos in json.display) {
                displayPositions[pos as DisplayPosition] = Display.fromJson(
                    json.display[pos],
                )
            }
        }

        if (
            json.ambientocclusion &&
            typeof json.ambientocclusion !== 'boolean'
        ) {
            throw new ModelParseError(
                'Invalid property "ambientocclusion": ' +
                    JSON.stringify(json.ambientocclusion),
            )
        }

        return new MinecraftModel(
            json.parent,
            json.textures,
            elements,
            displayPositions,
            json.ambientocclusion,
        )
    }
}
