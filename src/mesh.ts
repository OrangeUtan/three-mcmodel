import { Mesh } from 'three'
import { ElementGeometry } from './geometry'
import { MinecraftModelMaterial } from './material'
import { MISSING_TEXTURE, MinecraftTexture } from './texture'

export class ElementMesh extends Mesh {
    private textureToMaterialMap: { [texturePath: string]: MinecraftModelMaterial }

    constructor(geometry: ElementGeometry, textures: {[textureVar: string]: string}) {
        const texturePaths = [...new Set(Object.values(textures))].sort()
        const materialMapping: { [texturePath: string]: MinecraftModelMaterial } = {}
        const materials = texturePaths.map(
            (texturePath) =>
                (materialMapping[texturePath] = new MinecraftModelMaterial()),
        )

        super(geometry, [new MinecraftModelMaterial(), ...materials])

        this.textureToMaterialMap = materialMapping
    }

    public resolveTextures(
        resolver: (texturePath: string) => MinecraftTexture | undefined,
    ) {
        for (const texturePath in this.textureToMaterialMap) {
            this.textureToMaterialMap[texturePath]!.map = resolver(texturePath) ?? MISSING_TEXTURE
        }
    }
}
