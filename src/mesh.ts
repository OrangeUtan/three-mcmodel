import * as THREE from 'three'
import { FileLoader, Mesh } from 'three'
import { MinecraftModelGeometry } from './geometry'
import { MinecraftModelMaterial } from './material'
import { MinecraftModel } from './model'
import { MinecraftTexture } from './texture'

type TextureToMaterialMap = { [texturePath: string]: MinecraftModelMaterial }

export class MinecraftModelMesh extends Mesh {
    private textureToMaterialMap: TextureToMaterialMap

    constructor(model: MinecraftModel) {
        const geometry = new MinecraftModelGeometry(model)

        const texturePaths = [...new Set(Object.values(model.textures!))].sort()
        const materialMapping: TextureToMaterialMap = {}
        const materials = texturePaths.map(
            (texturePath) =>
                (materialMapping[texturePath] = new MinecraftModelMaterial()),
        )

        super(geometry, [new MinecraftModelMaterial(), ...materials])

        this.textureToMaterialMap = materialMapping
    }

    public resolveTextures(
        resolver: (texturePath: string) => MinecraftTexture,
    ) {
        for (const texturePath in this.textureToMaterialMap) {
            this.textureToMaterialMap[texturePath]!.map = resolver(texturePath)
        }
    }

    public updateAnimation(timeDelta: number) {
        for (const texture of Object.values(this.textureToMaterialMap)) {
            ;(texture.map as MinecraftTexture).updateAnimation(timeDelta)
        }
    }
}

export class MinecraftModelLoader extends THREE.Loader {
    public load(
        url: string,
        onLoad?: (mesh: MinecraftModelMesh) => void,
        onProgress?: (request: ProgressEvent) => void,
        onError?: (error: any) => void,
    ) {
        const loader = new FileLoader(this.manager)
        loader.setPath(this.path)
        loader.setResponseType('json')

        const handleLoad = (model: any) => {
            try {
                const mesh = new MinecraftModelMesh(
                    MinecraftModel.fromJson(model),
                )

                if (onLoad) {
                    onLoad(mesh)
                }
            } catch (err) {
                if (onError) {
                    onError(err)
                }
            }
        }

        loader.load(url, handleLoad, onProgress, onError)
    }
}
