import { ElementRotation, FaceType, RotationAxis, TextureRotationAngle, Vec3, Element } from '@oran9e/minecraft-model'
import { Float32BufferAttribute, Uint16BufferAttribute, Vector3, Vector4, Matrix3, BufferGeometry } from 'three'

const faceVertexIndicesMap: {
    [type in FaceType]: Vector4
} = {
    west: new Vector4(0, 1, 2, 3),
    east: new Vector4(4, 5, 6, 7),
    down: new Vector4(0, 3, 4, 7),
    up: new Vector4(2, 1, 6, 5),
    north: new Vector4(7, 6, 1, 0),
    south: new Vector4(3, 2, 5, 4),
}

function buildRotationMatrix(angle: number, scale: number, axis: RotationAxis) {
    const a = Math.cos(angle) * scale
    const b = Math.sin(angle) * scale

    switch (axis) {
        case RotationAxis.X:
            return new Matrix3().set(
                1, 0, 0,
                0, a, -b,
                0, b, a
            )
        case RotationAxis.Y:
            return new Matrix3().set(
                a, 0, b,
                0, 1, 0,
                -b, 0, a
            )
        case RotationAxis.Z:
            return new Matrix3().set(
                a, -b, 0,
                b, a, 0,
                0, 0, 1
            )
    }
}

function rotateFaceVertexIndices(
    vertexIndices: Vector4,
    angle: TextureRotationAngle,
): Vector4 {
    const [a, b, c, d] = vertexIndices.toArray()

    switch (angle) {
        case 0:
            return new Vector4(a, b, c, d)
        case 90:
            return new Vector4(b, c, d, a)
        case 180:
            return new Vector4(c, d, a, b)
        case 270:
            return new Vector4(d, a, b, c)
    }
}

function getDefaultUVs(faceType: FaceType, from: Vec3, to: Vec3): Vector4 {
    const [x1, y1, z1] = from
    const [x2, y2, z2] = to

    switch (faceType) {
        case FaceType.WEST:
            return new Vector4(z1, 16 - y2, z2, 16 - y1)
        case FaceType.EAST:
            return new Vector4(16 - z2, 16 - y2, 16 - z1, 16 - y1)
        case FaceType.DOWN:
            return new Vector4(x1, 16 - z2, x2, 16 - z1)
        case FaceType.UP:
            return new Vector4(x1, z1, x2, z2)
        case FaceType.NORTH:
            return new Vector4(16 - x2, 16 - y2, 16 - x1, 16 - y1)
        case FaceType.SOUTH:
            return new Vector4(x1, 16 - y2, x2, 16 - y1)
    }
}

function normalizedUVs(uvs: Vector4): Vector4 {
    return new Vector4().fromArray(uvs.toArray().map((coord, i) => (i % 2 ? 16 - coord : coord) / 16))
}

function getCubeCornerVertices(from: Vec3, to: Vec3): Vector3[] {
    let [x1, y1, z1] = from
    let [x2, y2, z2] = to

    return [
        new Vector3(x1, y1, z1),
        new Vector3(x1, y2, z1),
        new Vector3(x1, y2, z2),
        new Vector3(x1, y1, z2),
        new Vector3(x2, y1, z2),
        new Vector3(x2, y2, z2),
        new Vector3(x2, y2, z1),
        new Vector3(x2, y1, z1),
    ]
}

function rotateCubeCornerVertices(vertices: Vector3[], rotation: ElementRotation): Vector3[] {
    const angle = (rotation.angle / 180) * Math.PI
    const scale =
        rotation.rescale === true
            ? Math.SQRT2 / Math.sqrt(Math.cos(angle || Math.PI / 4) ** 2 * 2)
            : 1
    const rotationMatrix = buildRotationMatrix(angle, scale, rotation.axis)

    return vertices.map((vertex) => {
        const origin = new Vector3().fromArray(rotation.origin);
        return vertex
            .sub(origin)
            .applyMatrix3(rotationMatrix)
            .add(origin)
        }
    )
}

interface MaterialGroupAttributes {
    vertices: number[]
    uvs: number[]
    indices: number[]
}

class MaterialGroupAttributesBuilder {
    materialGroups: {[texturePath: string]: MaterialGroupAttributes } = {}
    private textureVarToGroupMap: {
        [variable: string]: MaterialGroupAttributes
    } = {}
    private missingGroup: MaterialGroupAttributes = {
        vertices: [],
        uvs: [],
        indices: [],
    }

    constructor(textures: {[textureVar: string]: string}) {
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

export class ElementGeometry extends BufferGeometry {
    constructor(public element: Element, textures: {[textureVar: string]: string}) {
        super()

        const {
            vertices,
            uvs,
            indices,
            groups,
        } = ElementGeometry.computeAttributes(element, textures)

        this.setAttribute('position', new Float32BufferAttribute(vertices, 3),)
        this.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
        this.setIndex(new Uint16BufferAttribute(indices, 1))

        for (const { start, count, materialIndex } of groups) {
            this.addGroup(start, count, materialIndex)
        }
    }

    public static computeAttributes(element: Element, textures: {[textureVar: string]: string}) {
        const builder = new MaterialGroupAttributesBuilder(textures);

        let cornerVertices = getCubeCornerVertices(element.from, element.to);
        if (element.rotation != null) {
            cornerVertices = rotateCubeCornerVertices(
                cornerVertices,
                element.rotation,
            )
        }

        Object.entries(element.faces).forEach(([faceType, face]) => {
            if (face === undefined) {
                return
            }

            const group = builder.getMaterialGroupFor(face.texture)

            const i = group.vertices.length / 3
            group.indices.push(i, i + 2, i + 1)
            group.indices.push(i, i + 3, i + 2)

            for (const index of rotateFaceVertexIndices(faceVertexIndicesMap[faceType as FaceType],face.rotation ?? 0).toArray()) {
                group.vertices.push(...cornerVertices[index]!.toArray())
            }

            const faceUVs = face.uv != null ? new Vector4().fromArray(face.uv) : getDefaultUVs(faceType as FaceType, element.from, element.to);

            const [u1, v1, u2, v2] = normalizedUVs(faceUVs).toArray();

            group.uvs.push(u1, v2);
            group.uvs.push(u1, v1);
            group.uvs.push(u2, v1);
            group.uvs.push(u2, v2);
        })

        return builder.getAttributes();
    }
}
