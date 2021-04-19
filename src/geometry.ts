import * as THREE from 'three'
import { Float32BufferAttribute, Uint16BufferAttribute } from 'three'
import {
    ElementRotation,
    FaceType,
    MinecraftModel,
    RotationAxis,
    TextureRotationAngle,
    Vec3,
    Vec4,
} from './model'

const faceVertexIndicesMap: {
    [type in FaceType]: Vec4
} = {
    west: [0, 1, 2, 3],
    east: [4, 5, 6, 7],
    down: [0, 3, 4, 7],
    up: [2, 1, 6, 5],
    north: [7, 6, 1, 0],
    south: [3, 2, 5, 4],
}

function buildRotationMatrix(angle: number, scale: number, axis: RotationAxis) {
    const a = Math.cos(angle) * scale
    const b = Math.sin(angle) * scale
    const matrix = new THREE.Matrix3()

    switch (axis) {
        case RotationAxis.X:
            matrix.set(1, 0, 0, 0, a, -b, 0, b, a)
            break
        case RotationAxis.Y:
            matrix.set(a, 0, b, 0, 1, 0, -b, 0, a)
            break
        case RotationAxis.Z:
            matrix.set(a, -b, 0, b, a, 0, 0, 0, 1)
            break
    }

    return matrix
}

function rotateFaceVertexIndices(
    vertexIndices: Vec4,
    angle: TextureRotationAngle,
) {
    const [a, b, c, d] = vertexIndices

    switch (angle) {
        case 0:
            return [a, b, c, d]
        case 90:
            return [b, c, d, a]
        case 180:
            return [c, d, a, b]
        case 270:
            return [d, a, b, c]
    }
}

function getDefaultUVs(faceType: FaceType, from: Vec3, to: Vec3): Vec4 {
    const [x1, y1, z1] = from
    const [x2, y2, z2] = to

    switch (faceType) {
        case FaceType.WEST:
            return [z1, 16 - y2, z2, 16 - y1]
        case FaceType.EAST:
            return [16 - z2, 16 - y2, 16 - z1, 16 - y1]
        case FaceType.DOWN:
            return [x1, 16 - z2, x2, 16 - z1]
        case FaceType.UP:
            return [x1, z1, x2, z2]
        case FaceType.NORTH:
            return [16 - x2, 16 - y2, 16 - x1, 16 - y1]
        case FaceType.SOUTH:
            return [x1, 16 - y2, x2, 16 - y1]
    }
}

function normalizedUVs(uvs: Vec4) {
    return uvs.map((coord, i) => (i % 2 ? 16 - coord : coord) / 16) as Vec4
}

function getCubeCornerVertices(from: Vec3, to: Vec3) {
    const [x1, y1, z1, x2, y2, z2] = from.concat(to).map((coord) => coord - 8)

    return [
        [x1, y1, z1],
        [x1, y2, z1],
        [x1, y2, z2],
        [x1, y1, z2],
        [x2, y1, z2],
        [x2, y2, z2],
        [x2, y2, z1],
        [x2, y1, z1],
    ] as Vec3[]
}

function rotateCubeCornerVertices(vertices: Vec3[], rotation: ElementRotation) {
    const origin = new THREE.Vector3().fromArray(rotation.origin).subScalar(8)

    const angle = (rotation.angle / 180) * Math.PI
    const scale =
        rotation.rescale === true
            ? Math.SQRT2 / Math.sqrt(Math.cos(angle || Math.PI / 4) ** 2 * 2)
            : 1
    const rotationMatrix = buildRotationMatrix(angle, scale, rotation.axis)

    return vertices.map((vertex) =>
        new THREE.Vector3()
            .fromArray(vertex)
            .sub(origin)
            .applyMatrix3(rotationMatrix)
            .add(origin)
            .toArray(),
    ) as Vec3[]
}

interface MaterialGroupAttributes {
    vertices: number[]
    uvs: number[]
    indices: number[]
}

class MaterialGroupAttributesBuilder {
    materialGroups: { [texturePath: string]: MaterialGroupAttributes } = {}
    private textureVarToGroupMap: {
        [variable: string]: MaterialGroupAttributes
    } = {}
    private missingGroup: MaterialGroupAttributes = {
        vertices: [],
        uvs: [],
        indices: [],
    }

    constructor(textures: { [textureVar: string]: string }) {
        for (const texturePath of new Set(Object.values(textures))) {
            this.materialGroups[texturePath] = {
                vertices: [],
                uvs: [],
                indices: [],
            }
        }

        for (const textureVar in textures) {
            this.textureVarToGroupMap['#' + textureVar] = this.materialGroups[
                textures[textureVar]!
            ]!
        }
    }

    public getMaterialGroupFor(textureVar: string) {
        return this.textureVarToGroupMap[textureVar] || this.missingGroup
    }

    getAttributes() {
        let { vertices, uvs, indices } = this.missingGroup
        let indexCount = indices.length

        const groups = [{ start: 0, count: indexCount, materialIndex: 0 }]
        groups.push(
            ...Object.entries(this.materialGroups)
                .sort()
                .map(([textureVar, group], i) => {
                    const start = indexCount
                    const count = group.indices.length
                    const offset = vertices.length / 3

                    vertices = vertices.concat(group.vertices)
                    uvs = uvs.concat(group.uvs)
                    indices = indices.concat(
                        group.indices.map((index) => index + offset),
                    )

                    indexCount += group.indices.length

                    return { start, count, materialIndex: i + 1 }
                }),
        )

        return { vertices, uvs, indices, groups }
    }
}

export class MinecraftModelGeometry extends THREE.BufferGeometry {
    constructor(model: MinecraftModel) {
        super()

        const {
            vertices,
            uvs,
            indices,
            groups,
        } = MinecraftModelGeometry.computeAttributes(model)
        this.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(vertices, 3),
        )
        this.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
        this.setIndex(new Uint16BufferAttribute(indices, 1))

        for (const { start, count, materialIndex } of groups) {
            this.addGroup(start, count, materialIndex)
        }
    }

    /**
     * Compute geometry attributes from Minecraft model
     */
    public static computeAttributes(model: MinecraftModel) {
        const builder = new MaterialGroupAttributesBuilder(model.textures)

        for (const elem of model.elements || []) {
            let cornerVertices = getCubeCornerVertices(elem.from, elem.to)
            if (elem.rotation != null) {
                cornerVertices = rotateCubeCornerVertices(
                    cornerVertices,
                    elem.rotation,
                )
            }

            Object.entries(elem.faces).forEach(([faceType, face]) => {
                if (face === undefined) {
                    return
                }

                const group = builder.getMaterialGroupFor(face.texture)

                const i = group.vertices.length / 3
                group.indices.push(i, i + 2, i + 1)
                group.indices.push(i, i + 3, i + 2)

                for (const index of rotateFaceVertexIndices(
                    faceVertexIndicesMap[faceType as FaceType],
                    face.rotation || 0,
                )) {
                    group.vertices.push(...cornerVertices[index]!)
                }

                const faceUVs =
                    face.uv ||
                    getDefaultUVs(faceType as FaceType, elem.from, elem.to)
                const [u1, v1, u2, v2] = normalizedUVs(faceUVs)

                group.uvs.push(u1, v2)
                group.uvs.push(u1, v1)
                group.uvs.push(u2, v1)
                group.uvs.push(u2, v2)
            })
        }

        return builder.getAttributes()
    }
}
