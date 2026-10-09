import { topicTitle } from './topics.js'

const ASSET_ROOT = '/ui-assets'

const asset = (file, alt) => Object.freeze({ src: `${ASSET_ROOT}/${file}`, alt })

export const VISUAL_ASSETS = Object.freeze({
  apple: asset('apple.png', 'apple'),
  banana: asset('banana.png', 'banana'),
  mango: asset('mango.png', 'mango'),
  bilao: asset('bilao.png', 'round woven bilao'),
  block: asset('wooden-block.png', 'wooden counting block'),
  monkeyHelper: asset('monkey-helper.png', 'friendly monkey helper'),
  classroomDoor: asset('classroom-door.png', 'rectangular classroom door'),
  banderitasTriangle: asset('banderitas-triangle.png', 'triangular banderitas pennant'),
  roundPlate: asset('round-plate.png', 'round plate'),
  pencil: asset('pencil.png', 'pencil'),
  sortingBasket: asset('sorting-basket.png', 'empty sorting basket'),
  square: asset('shape-square.svg', 'square'),
  triangle: asset('shape-triangle.svg', 'triangle'),
  rectangle: asset('shape-rectangle.svg', 'rectangle'),
  circle: asset('shape-circle.svg', 'circle'),
  halfCircle: asset('shape-half-circle.svg', 'half circle'),
  quarterCircle: asset('shape-quarter-circle.svg', 'quarter circle'),
  cube: asset('solid-cube.svg', 'cube'),
  sphere: asset('solid-sphere.svg', 'sphere'),
  cylinder: asset('solid-cylinder.svg', 'cylinder'),
  cone: asset('solid-cone.svg', 'cone'),
  twoTrianglesSquare: asset('example-two-triangles-square.svg', 'two equal right triangles joined to form a square'),
  compositeSquareTriangles: asset('composite-square-two-triangles.svg', 'one square and two triangles in a composite figure'),
  gardenRows: asset('visual-garden-rows.svg', 'garden rows measuring five metres and eight metres'),
  pencilBlocks: asset('visual-pencil-blocks.svg', 'pencil measured with five equal blocks'),
  jeepney: asset('jeepney.png', 'colorful Philippine jeepney'),
  equalSharingCupcakes: asset('equal-sharing-cupcakes.png', 'twelve cupcakes shared equally among four plates'),
  sariSariStore: asset('sari-sari-store.png', 'Filipino sari-sari store'),
  gardenRowsIllustrated: asset('garden-rows-illustrated.png', 'two rows of plants in a school garden'),
  countingTen: asset('visual-counting-ten.svg', 'ten mangoes arranged in two rows of five'),
  skipCounting: asset('visual-skip-counting.svg', 'skip counting by twos from 28 to 36'),
  tensOnes: asset('visual-tens-ones.svg', 'two tens and four ones'),
  numberModel: asset('visual-number-model.svg', 'number 47 modeled with tens and ones'),
  compareNumbers: asset('visual-compare-numbers.svg', '18 is less than 24'),
  orderingCards: asset('visual-ordering-cards.svg', 'number cards arranged from least to greatest'),
  ordinalLine: asset('visual-ordinal-line.svg', 'five positions in ordinal order'),
  numberBond: asset('visual-number-bond.svg', 'number bond showing 7 and 5 make 12'),
  patternStrip: asset('visual-pattern-strip.svg', 'repeating circle triangle square pattern'),
  additionTenFrame: asset('visual-addition-ten-frame.svg', 'ten frame showing 6 plus 3 equals 9'),
  subtractionTakeaway: asset('visual-subtraction.svg', 'eight apples with three taken away'),
  commutativeAddition: asset('visual-commutative-addition.svg', '2 plus 3 equals 3 plus 2'),
  numberSentence: asset('visual-number-sentence.svg', 'balanced number sentence 4 plus 3 equals 7'),
  multiplicationArray: asset('visual-multiplication-array.svg', 'three rows of four counters'),
  missingFactor: asset('visual-missing-factor.svg', 'missing factor times four equals twelve'),
  evenOdd: asset('visual-even-odd.svg', 'even pairs compared with an odd group'),
  elapsedTime: asset('visual-elapsed-time.svg', 'elapsed time timeline from two to four o’clock'),
  numberTools: asset('visual-number-tools.svg', 'abacus and place-value learning tools'),
  numberLine: asset('visual-number-line.svg', 'number line model'),
  clock: asset('visual-clock.svg', 'analog clock model'),
  calendar: asset('visual-calendar.svg', 'calendar model'),
  money: asset('visual-money.svg', 'Philippine money model'),
  barGraph: asset('visual-bar-graph.svg', 'bar graph model'),
  fractionCircle: asset('visual-fraction-circle.svg', 'circle divided into four equal parts'),
  balance: asset('visual-balance.svg', 'balance scale model'),
  capacity: asset('visual-capacity.svg', 'measuring container model'),
  areaGrid: asset('visual-area-grid.svg', 'rectangle covered by equal square tiles'),
  directions: asset('visual-directions.svg', 'direction and turn arrows'),
  die: asset('visual-die.svg', 'number die'),
  symmetry: asset('visual-symmetry.svg', 'symmetric shape with a line of symmetry'),
})

const CHOICE_ASSET_KEYS = Object.freeze({
  square: 'square',
  triangle: 'triangle',
  rectangle: 'rectangle',
  circle: 'circle',
  'half circle': 'halfCircle',
  semicircle: 'halfCircle',
  'quarter circle': 'quarterCircle',
  cube: 'cube',
  sphere: 'sphere',
  cylinder: 'cylinder',
  cone: 'cone',
})

const QUESTION_CONTEXTS = Object.freeze([
  Object.freeze({ pattern: /28\s*,\s*30\s*,\s*32/i, assetKey: 'skipCounting' }),
  Object.freeze({ pattern: /12\s+(?:items|cupcakes).+(?:4\s+groups|four\s+plates)|4\s+(?:groups|plates).+12/i, assetKey: 'equalSharingCupcakes' }),
  Object.freeze({ pattern: /sari-sari store/i, assetKey: 'sariSariStore' }),
  Object.freeze({ pattern: /jeepney/i, assetKey: 'jeepney' }),
  Object.freeze({ pattern: /18\s*(?:and|at)\s*24|18\s*[<>=]\s*24/i, assetKey: 'compareNumbers' }),
  Object.freeze({ pattern: /6\s*\+\s*3\s*=\s*9/i, assetKey: 'additionTenFrame' }),
  Object.freeze({ pattern: /8\s*[−-]\s*3\s*=\s*5/i, assetKey: 'subtractionTakeaway' }),
  Object.freeze({ pattern: /2\s*\+\s*3.+3\s*\+\s*2/i, assetKey: 'commutativeAddition' }),
  Object.freeze({ pattern: /3\s*(?:rows|groups).+4.+12/i, assetKey: 'multiplicationArray' }),
  Object.freeze({ pattern: /2:00.+4:00/i, assetKey: 'elapsedTime' }),
  Object.freeze({ pattern: /equal right triangles.+longest sides/i, assetKey: 'twoTrianglesSquare' }),
  Object.freeze({ pattern: /composite figure|one square and two triangles/i, assetKey: 'compositeSquareTriangles' }),
  Object.freeze({ pattern: /classroom door/i, assetKey: 'classroomDoor' }),
  Object.freeze({ pattern: /banderitas|pennant/i, assetKey: 'banderitasTriangle' }),
  Object.freeze({ pattern: /\bbilao\b/i, assetKey: 'bilao' }),
  Object.freeze({ pattern: /\bplate\b/i, assetKey: 'roundPlate' }),
  Object.freeze({ pattern: /\bpencil\b/i, assetKey: 'pencil' }),
  Object.freeze({ pattern: /\bbasket\b/i, assetKey: 'sortingBasket' }),
])

const TOPIC_VISUAL_RULES = Object.freeze([
  Object.freeze({ pattern: /2D Shapes/, assetKey: 'square' }),
  Object.freeze({ pattern: /Building Shapes|Composite Shapes/, assetKey: 'twoTrianglesSquare' }),
  Object.freeze({ pattern: /3D Shapes/, assetKey: 'cube' }),
  Object.freeze({ pattern: /Area|Perimeter/, assetKey: 'areaGrid' }),
  Object.freeze({ pattern: /Lines/, assetKey: 'numberLine' }),
  Object.freeze({ pattern: /Transformations|Turns and Direction/, assetKey: 'directions' }),
  Object.freeze({ pattern: /Symmetry/, assetKey: 'symmetry' }),
  Object.freeze({ pattern: /Fraction|Halves and Quarters/, assetKey: 'fractionCircle' }),
  Object.freeze({ pattern: /Money Problems/, assetKey: 'sariSariStore' }),
  Object.freeze({ pattern: /Money/, assetKey: 'money' }),
  Object.freeze({ pattern: /Time/, assetKey: 'clock' }),
  Object.freeze({ pattern: /Calendar/, assetKey: 'calendar' }),
  Object.freeze({ pattern: /Pictographs|Bar Graphs|Collecting Data/, assetKey: 'barGraph' }),
  Object.freeze({ pattern: /Probability|Likelihood/, assetKey: 'die' }),
  Object.freeze({ pattern: /Mass/, assetKey: 'balance' }),
  Object.freeze({ pattern: /Capacity/, assetKey: 'capacity' }),
  Object.freeze({ pattern: /Length and Distance/, assetKey: 'pencilBlocks' }),
  Object.freeze({ pattern: /Ordinal/, assetKey: 'jeepney' }),
  Object.freeze({ pattern: /Tens and Ones|Place Value|Reading Numbers|Number Models|Ordering Numbers|Comparing Numbers|Counting|Rounding/, assetKey: 'numberTools' }),
  Object.freeze({ pattern: /Addition|Subtraction|Number Sentences|Estimating|Mixed Operations/, assetKey: 'apple' }),
  Object.freeze({ pattern: /Equal Groups|Multiplication|Division|Missing Factors|Even and Odd/, assetKey: 'sortingBasket' }),
  Object.freeze({ pattern: /Patterns|Skip Counting|Number Bonds/, assetKey: 'numberTools' }),
])

const REF_VISUAL_KEYS = Object.freeze({
  '1NA-Ib-1': 'skipCounting',
})

function normalizeChoice(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^(?:one whole|a|an|one)\s+/, '')
    .trim()
}

export function visualForChoice(value) {
  const key = CHOICE_ASSET_KEYS[normalizeChoice(value)]
  return key ? VISUAL_ASSETS[key] : null
}

export function visualForQuestion(question) {
  const text = String(question ?? '')
  const context = QUESTION_CONTEXTS.find(({ pattern }) => pattern.test(text))
  return context ? VISUAL_ASSETS[context.assetKey] : null
}

export function visualKeyForCompetency(competency) {
  if (competency?.example_visual && VISUAL_ASSETS[competency.example_visual]) return competency.example_visual
  if (REF_VISUAL_KEYS[competency?.ref]) return REF_VISUAL_KEYS[competency.ref]
  const title = topicTitle(competency?.ref, competency?.competency)
  return TOPIC_VISUAL_RULES.find(({ pattern }) => pattern.test(title))?.assetKey ?? 'block'
}
