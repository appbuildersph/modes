// Classroom textures. Vite bundles these PNG imports (hashed URLs) so the PWA
// can precache them for offline use. Surfaces (wall/floor/ceiling) tile a base
// texture; decor (posters, window, rug, corkboard) are single-image planes.

import * as THREE from 'three'
import wallUrl from '../../textures/wall-plaster-cream.png'
import floorUrl from '../../textures/floor-wood-planks.png'
import ceilingUrl from '../../textures/ceiling-plaster.png'
import corkboardUrl from '../../textures/corkboard.png'
import rugUrl from '../../textures/rug-warm.png'
import windowUrl from '../../textures/window-city.png'
import posterFractionsUrl from '../../textures/poster-fractions.png'
import posterGeometryUrl from '../../textures/poster-geometry-shapes.png'
import posterMultiplicationUrl from '../../textures/poster-multiplication.png'
import posterNumberLineUrl from '../../textures/poster-number-line.png'
import posterMotivationalUrl from '../../textures/poster-motivational.png'

const loader = new THREE.TextureLoader()

// Tiling surface texture (RepeatWrapping). `repeat` controls tile density.
export function tilingTexture(url, repeatX = 1, repeatY = 1) {
  const tex = loader.load(url)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatX, repeatY)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

// Single-image decor texture (clamped, no tiling).
export function decorTexture(url) {
  const tex = loader.load(url)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export const TEX = {
  wall: wallUrl,
  floor: floorUrl,
  ceiling: ceilingUrl,
  corkboard: corkboardUrl,
  rug: rugUrl,
  window: windowUrl,
  posters: [
    posterFractionsUrl,
    posterGeometryUrl,
    posterMultiplicationUrl,
    posterNumberLineUrl,
    posterMotivationalUrl,
  ],
}
