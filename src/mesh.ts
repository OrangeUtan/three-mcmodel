import { Mesh } from 'three'
import { ElementGeometry } from './geometry'
import { MinecraftModelMaterial } from './material'
import { MISSING_TEXTURE, MinecraftTexture } from './texture'
import { lcm } from './utils'

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

    public isAnimated() {
        return Object.values(this.textureToMaterialMap).map(m => m.map).some(t=> (t as MinecraftTexture | undefined)?.isAnimated())
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
