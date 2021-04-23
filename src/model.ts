// Types for minecraft json models (see https://minecraft.fandom.com/wiki/Model)

import { isObject } from './utils'
import { Vector3, Vector4, Loader, FileLoader } from 'three'

export class ModelParseError extends Error {
    constructor(msg?: string) {
        super(msg)
        Object.setPrototypeOf(this, new.target.prototype)
        this.name = ModelParseError.name
    }
}

export function validateVector(vec: any, size: number) {
    if (
        Array.isArray(vec) &&
        vec.length === size &&
        vec.every((coord) => typeof coord === 'number')
    ) {
        return true
    } else {
        throw new ModelParseError(`Invalid Vector${size}: ${JSON.stringify(vec)}`)
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
        public uv?: Vector4,
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
            validateVector(json.uv, 4)
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
            json.uv != null ? new Vector4().fromArray(json.uv) : undefined,
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
    public rotation: Vector3
    public translation: Vector3
    public scale: Vector3

    constructor(rotation?: Vector3, translation?: Vector3, scale?: Vector3) {
        this.rotation = rotation ?? new Vector3(0, 0, 0)
        this.translation = translation?.clampScalar(-80, 80) ?? new Vector3(0, 0, 0)
        this.scale = scale?.clampScalar(0, 4) ?? new Vector3(1, 1, 1)
    }

    static fromJson(json: any) {
        if (!isObject(json)) {
            throw new ModelParseError(
                'Invalid element display: ' + JSON.stringify(json),
            )
        }

        if (json.rotation != null) {
            validateVector(json.rotation, 3)
        }
        if (json.translation != null) {
            validateVector(json.translation, 3)
        }
        if (json.scale != null) {
            validateVector(json.scale, 3)
        }

        return new Display(
            json.rotation != null ? new Vector3().fromArray(json.rotation) : undefined,
            json.translation != null ? new Vector3().fromArray(json.translation) : undefined,
            json.scale != null ? new Vector3().fromArray(json.scale) : undefined
        )
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
        public origin: Vector3,
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

        validateVector(json.origin, 3)

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
            new Vector3().fromArray(json.origin),
            json.angle,
            json.axis,
            json.rescale,
        )
    }
}

export class Element {
    public shade: boolean

    constructor(
        public from: Vector3,
        public to: Vector3,
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

        validateVector(json.from, 3)
        validateVector(json.to, 3)

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

        return new Element(
            new Vector3().fromArray(json.from),
            new Vector3().fromArray(json.to),
            faces,
            rotation,
            json.shade
        )
    }
}

export class MinecraftModel {
    public ambientocclusion: boolean

    constructor(
        public parent?: string,
        public textures?: { [textureVar: string]: string },
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

    hasElements() {
        return this.elements != null && this.elements.length >= 1;
    }
}

export class MinecraftModelLoader extends Loader {
    public async load(url: string) {
        const loader = new FileLoader(this.manager)
        loader.setPath(this.path)
        loader.setResponseType('json')

        const data = await loader.loadAsync(url)
        return MinecraftModel.fromJson(data)
    }
}

export class HierarchicalModelResolver {
    private hierarchy: MinecraftModel[];

    constructor(model: MinecraftModel, ancestors: {[assetPath: string]: MinecraftModel}) {
        this.hierarchy = this.createHierarchy(model, ancestors);
    }

    get elements() {
        for(const model of this.hierarchy) {
            if(model.elements != null && model.elements.length >= 1) {
                return model.elements;
            }
        }
        return undefined;
    }

    get textures() {
        let textures = {};
        for(let i = this.hierarchy.length-1; i >= 0; i--) {
            const model = this.hierarchy[i]!;
            if(model.textures != null) {
                Object.assign(textures, model.textures);
            }
        }
        return textures;
    }

    private createHierarchy(root: MinecraftModel, ancestors: {[assetPath: string]: MinecraftModel}) {
        let hierarchy = [root];
        let current = root;
        while(current.parent != null) {
            const parent = ancestors[current.parent];
            if(parent != null) {
                hierarchy.push(parent);
                current = parent;
            } else {
                break;
            }
        }
        return hierarchy;
    }
}