import { Mesh } from 'three'
import { MinecraftModelGeometry } from './geometry'
import { MinecraftModelMaterial } from './material'
import { MinecraftModel } from './model'
import { MISSING_TEXTURE, MinecraftTexture } from './texture'
import { lcm } from './utils'


export class MinecraftModelMesh extends Mesh {
    private textureToMaterialMap: { [texturePath: string]: MinecraftModelMaterial }

    constructor(model: MinecraftModel) {
        const geometry = new MinecraftModelGeometry(model)

        const texturePaths = [...new Set(Object.values(model.textures!))].sort()
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

    public isAnimated() {
        return Object.values(this.textureToMaterialMap).map(m => m.map).every(t=> (t as MinecraftTexture | undefined)?.isAnimated())
    }

    public setAnimationFrame(index: number) {
        for(const texture of Object.values(this.textureToMaterialMap)) {
            (texture.map as MinecraftTexture).setAnimationFrame(index);
        }
    }

    public getAnimationPeriod() {
        return Object.values(this.textureToMaterialMap)
            .map(m => (m.map as MinecraftTexture)?.numFrames() ?? 1)
            .reduce((prev, current) => lcm(prev, current), 1)
    }
}
