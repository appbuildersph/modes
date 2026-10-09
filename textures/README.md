# Gabay classroom textures and pictures

This folder contains warm, low-poly classroom textures and picture decals used by the 3D classroom. The assets are bundled with the app for offline use, so the classroom does not depend on CDN downloads or external image hosts.

The textures are original project assets and do not require third-party attribution.

## Files

| File | Size (px) | Tileable | Suggested use |
| --- | --- | --- | --- |
| `wall-plaster-cream.png` | 512x512 | seamless (x+y) | Upper walls, main warm cream plaster |
| `wall-plaster-tan.png` | 512x512 | seamless (x+y) | Accent or mid-wall band |
| `wainscot-wood-vertical.png` | 512x512 | seamless (x) | Lower-wall wood paneling |
| `wood-trim-rail.png` | 512x96 | seamless (x) | Chair-rail or picture-rail strip |
| `floor-wood-planks.png` | 512x512 | seamless (x+y) | Wood-plank floor |
| `floor-tile-warm.png` | 512x512 | seamless (x+y) | Warm tile floor |
| `ceiling-plaster.png` | 512x512 | seamless (x+y) | Ceiling plaster |
| `baseboard-wood.png` | 512x96 | seamless (x) | Dark skirting or baseboard strip |
| `chalkboard-green.png` | 960x600 | no | Blackboard slate with chalk dust |
| `corkboard.png` | 512x512 | seamless (x+y) | Cork bulletin board material |
| `poster-multiplication.png` | 600x760 | no | Multiplication poster |
| `poster-geometry-shapes.png` | 600x760 | no | Geometry shapes poster |
| `poster-fractions.png` | 600x760 | no | Fractions poster |
| `poster-number-line.png` | 820x480 | no | Number line poster |
| `poster-motivational.png` | 600x760 | no | Motivational poster |
| `picture-landscape.png` | 760x560 | no | Framed low-poly landscape art |
| `picture-abstract.png` | 600x760 | no | Framed abstract decor art |
| `window-city.png` | 780x580 | no | Window with city skyline |
| `rug-warm.png` | 780x520 | no | Area rug |
| `fabric-upholstery.png` | 512x512 | seamless (x+y) | Chair or sofa upholstery weave |

Posters, pictures, the window, and the rug include transparent margins and can be placed as decal planes in the Three.js scene.

## Using Them In Three.js

For color maps, set the sRGB color space. For seamless materials, enable wrapping and set a repeat that matches the mesh scale.

```js
import * as THREE from 'three'

const loader = new THREE.TextureLoader()

function loadTiling(url, repeatX = 1, repeatY = 1) {
  const tex = loader.load(url)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatX, repeatY)
  return tex
}

const wall = new THREE.MeshStandardMaterial({
  map: loadTiling('/textures/wall-plaster-cream.png', 4, 3),
})
```