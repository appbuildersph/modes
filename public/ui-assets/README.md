# Gabay UI learning assets

Reusable, text-free visual objects for Grade 1-3 math lessons.

The app should compose these assets in code so quantities, grouping, order, and
fractions remain mathematically exact. Do not bake answers or numerals into the
artwork. Keep learner-facing labels in the app's localization system.

## Intended uses

- `apple.png`, `banana.png`, `mango.png`: counting, addition, subtraction,
  comparison, equal groups, multiplication, division, and pictographs.
- `bilao.png`: circles, halves, quarters, sharing, and Filipino-context word
  problems.
- `wooden-block.png`: number models, place value, patterns, area arrays, and
  perimeter.
- `monkey-helper.png`: optional encouraging character for visual hints and
  worked examples; never use it as a substitute for the existing Gabay mascot.
- `classroom-door.png`, `banderitas-triangle.png`, `round-plate.png`: familiar
  real-world examples of rectangles, triangles, and circles.
- `pencil.png`, `sorting-basket.png`: reusable measurement, ordering, grouping,
  multiplication, division, and data-story props.
- `shape-*.svg`: exact 2D shapes for answer choices and manipulatives.
- `solid-*.svg`: exact, lightweight 3D-solid illustrations for answer choices.
- `example-*.svg`: exact diagrams authored for a specific curated worked example.
- `visual-*.svg`: reusable number-line, clock, calendar, money, graph,
  fraction, measurement, direction, probability, area, and symmetry models.

## Added number-sense pack

- Illustrated context cutouts: `jeepney.png`, `equal-sharing-cupcakes.png`,
  `sari-sari-store.png`, and `garden-rows-illustrated.png`.
- Exact math models: counting ten, skip counting, tens and ones, number model,
  comparison, ordering, ordinal position, number bond, repeating pattern,
  addition, subtraction, commutative addition, number sentence,
  multiplication array, missing factor, even/odd, and elapsed time.
- `visual-number-tools.svg` is the neutral fallback for number topics. Diagrams
  containing fixed values are only matched to prompts with those same values.

## Rendering rules

- Give every image meaningful alt text when it conveys lesson information.
- Repeat objects in code from structured visual data; never infer counts from an
  image filename.
- Use CSS/SVG for exact geometry, number lines, clocks, graphs, and fraction
  partitions. Raster art may decorate those diagrams but must not define the
  mathematical truth.
- Prefer lazy-loaded images and keep the full Grade 1-3 pack available offline.
- Register every runtime asset in `src/lib/visual-assets.js`; do not scatter
  public paths or question-matching rules through screen components.
