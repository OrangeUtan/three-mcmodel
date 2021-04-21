import * as THREE from 'three'

export const CHECKERBOARD_IMAGE = new THREE.ImageLoader().load(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH4goSFSEEtucn/QAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAkSURBVCjPY2TAAX4w/MAqzsRAIhjVQAxgxBXeHAwco6FEPw0A+iAED8NWwMQAAAAASUVORK5CYII=',
)

export class MinecraftTexture extends THREE.Texture {
    private currentTileIdx = 0
    private numTiles = 1
    private currentTileDisplayTime = 0

    constructor() {
        super(CHECKERBOARD_IMAGE)
        this.magFilter = this.minFilter = THREE.NearestFilter
        this.wrapT = THREE.RepeatWrapping
        this.needsUpdate = true
    }

    set(image: HTMLImageElement, numTiles = 1) {
        this.image = image

        this.numTiles = numTiles
        this.repeat.set(1, 1 / numTiles)
        this.currentTileIdx = 0
        this.currentTileDisplayTime = 0

        this.needsUpdate = true
    }

    updateAnimation(timeDelta: number) {
        if (this.numTiles > 1) {
            this.currentTileDisplayTime += timeDelta

            while (this.currentTileDisplayTime > 500) {
                this.currentTileDisplayTime -= 500
                this.currentTileIdx = this.currentTileIdx + (1 % this.numTiles)
                this.offset.y = this.currentTileIdx / this.numTiles
            }
        }
    }
}

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
