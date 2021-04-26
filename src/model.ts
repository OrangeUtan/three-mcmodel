// Types for minecraft json models (see https://minecraft.fandom.com/wiki/Model)

import { Loader, FileLoader } from 'three'
import { MinecraftModel, validateMinecraftModelJson, MinecraftModelJson } from '@oran9e/minecraft-model'

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