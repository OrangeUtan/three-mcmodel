import * as THREE from 'three'
import { lcm } from './utils'

export const CHECKERBOARD_IMAGE = new THREE.ImageLoader().load(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH4goSFSEEtucn/QAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAkSURBVCjPY2TAAX4w/MAqzsRAIhjVQAxgxBXeHAwco6FEPw0A+iAED8NWwMQAAAAASUVORK5CYII=',
)

export class MinecraftTexture extends THREE.Texture {
    private tileIdx = 0
    private numTiles = 1

    constructor(image = CHECKERBOARD_IMAGE) {
        super(image)
        this.magFilter = this.minFilter = THREE.NearestFilter
        this.wrapT = THREE.RepeatWrapping
        this.needsUpdate = true
    }

    set(image: HTMLImageElement, numTiles = 1) {
        this.image = image

        this.numTiles = numTiles
        this.repeat.set(1, 1 / numTiles)
        this.tileIdx = 0

        this.needsUpdate = true
    }

    isAnimated() {
        return this.numTiles > 1
    }

    setAnimationFrame(index: number) {
        this.tileIdx = index % this.numTiles
        this.offset.y = this.tileIdx / this.numTiles
    }

    numFrames() {
        return this.numTiles
    }
}

/**
 * Calculates period after which all texture animations repeat
 */
export function calculateCommonAnimationPeriod(textures: MinecraftTexture[]) {
    return textures
        .map(t => t.numFrames())
        .reduce((prev, current) => lcm(prev, current), 1);
}

export const MISSING_TEXTURE = new MinecraftTexture()

export class MinecraftTextureLoader extends THREE.Loader {
    public crossOrigin = 'anonymous'

    public async load(url: string) {
        const texture = new MinecraftTexture()

        if (url == null) {
            return texture
        }

        const loader = new THREE.ImageLoader(this.manager)
        loader.setCrossOrigin(this.crossOrigin)
        loader.setPath(this.path)

        const image = await loader.loadAsync(url)
        if (!this.hasValidDimensions(image)) {
            throw new Error(`Invalid image dimensions: ${image.height}x${image.width}`)
        }

        const numTiles = image.height / image.width
        texture.set(image, numTiles)

        return texture
    }

    public setCrossOrigin(value: string) {
        this.crossOrigin = value
        return this
    }

    private hasValidDimensions(image: HTMLImageElement) {
        return (
            Math.log2(image.width) % 1 === 0 && image.height % image.width === 0
        )
    }
}
