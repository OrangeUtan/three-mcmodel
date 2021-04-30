// Types for minecraft json models (see https://minecraft.fandom.com/wiki/Model)

import { Loader, FileLoader } from 'three'
import {
    MinecraftModel,
    validateMinecraftModelJson,
    MinecraftModelJson,
} from '@oran9e/minecraft-model'

export class MinecraftModelLoader extends Loader {
    public async load(url: string) {
        const loader = new FileLoader(this.manager)
        loader.setPath(this.path)
        loader.setResponseType('json')

        const data = await loader.loadAsync(url)
        validateMinecraftModelJson(data)
        return MinecraftModel.fromJson(data as MinecraftModelJson)
    }
}
