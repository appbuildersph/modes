import { topicTitle } from './topics.js'

const text = (en, fil, taglish) => Object.freeze({ en, fil, taglish })

const RULES = Object.freeze([
  Object.freeze({
    pattern: /Shapes|Symmetry/,
    explanation: text(
      'Shapes have features we can see and compare, such as straight or curved sides, corners, faces, and matching halves. These features stay the same even when a shape is moved or turned.',
      'May mga katangian ang mga hugis na maaari nating makita at ihambing, tulad ng tuwid o kurbadong gilid, sulok, mukha, at magkatugmang kalahati. Hindi nagbabago ang mga katangiang ito kahit ilipat o ikot ang hugis.',
      'May features ang shapes na puwedeng makita at i-compare, gaya ng straight o curved sides, corners, faces, at matching halves. Same pa rin ang features kahit i-move o i-turn ang shape.',
    ),
    guide: text('Check the defining features, then compare them with the choices.', 'Tingnan ang mahahalagang katangian, saka ihambing ang mga ito sa mga pagpipilian.', 'Check the important features, then i-compare sa choices.'),
  }),
  Object.freeze({
    pattern: /Counting|Reading Numbers|Number Models|Place Value|Tens and Ones|Ordinal|Ordering|Comparing|Rounding|Number Bonds|Skip Counting/,
    explanation: text(
      'Numbers tell how many, which position, or how large a quantity is. We can model numbers with objects, groups, digits, and number lines so their value is easier to see.',
      'Sinasabi ng mga numero kung ilan, anong puwesto, o gaano kalaki ang isang dami. Maaari nating katawanin ang mga numero gamit ang bagay, pangkat, digit, at number line para mas madaling makita ang halaga.',
      'Numbers tell kung ilan, anong position, o gaano kalaki ang quantity. Puwede natin silang i-model gamit ang objects, groups, digits, at number line para mas madaling makita ang value.',
    ),
    guide: text('Build or locate the number first, then read, compare, or change it as asked.', 'Buuin o hanapin muna ang numero, saka ito basahin, ihambing, o baguhin ayon sa tanong.', 'Build or hanapin muna ang number, then read, compare, or change it as asked.'),
  }),
  Object.freeze({
    pattern: /Addition|Estimating Sums/,
    explanation: text('Addition combines quantities. Count all the objects or add each place value, starting with the ones.', 'Pinagsasama ng addition ang mga dami. Bilangin ang lahat ng bagay o idagdag ang bawat place value, simula sa ones.', 'Addition combines quantities. Count all objects or add each place value, starting sa ones.'),
    guide: text('Identify the addends, combine them, and check that the total is reasonable.', 'Tukuyin ang mga addend, pagsamahin ang mga ito, at tiyaking makatuwiran ang kabuuan.', 'Find the addends, combine them, then check kung reasonable ang total.'),
  }),
  Object.freeze({
    pattern: /Subtraction|Estimating Differences/,
    explanation: text('Subtraction finds what remains or the difference between two quantities. Start with the whole amount and take away or compare.', 'Hinahanap ng subtraction ang natira o ang diperensiya ng dalawang dami. Magsimula sa kabuuan at magbawas o maghambing.', 'Subtraction finds what remains or the difference. Start sa whole amount, then take away or compare.'),
    guide: text('Find the starting amount, remove the stated amount, and count what remains.', 'Hanapin ang panimulang dami, alisin ang ibinawas, at bilangin ang natira.', 'Find the starting amount, remove what is taken away, then count what remains.'),
  }),
  Object.freeze({
    pattern: /Equal Groups|Multiplication|Estimating Products/,
    explanation: text('Multiplication combines equal groups. The number of groups multiplied by the amount in each group gives the total.', 'Pinagsasama ng multiplication ang magkakapantay na pangkat. Ang bilang ng pangkat na minultiply sa dami sa bawat pangkat ang nagbibigay ng kabuuan.', 'Multiplication combines equal groups. Number of groups times items in each group gives the total.'),
    guide: text('Find the equal groups and the amount in each group, then multiply or add repeatedly.', 'Hanapin ang magkakapantay na pangkat at dami sa bawat pangkat, saka mag-multiply o paulit-ulit na mag-add.', 'Find the equal groups and items per group, then multiply or use repeated addition.'),
  }),
  Object.freeze({
    pattern: /Division|Estimating Quotients|Missing Factors|Even and Odd/,
    explanation: text('Division shares a quantity equally or forms equal groups. The answer tells how many are in each group or how many groups can be made.', 'Pantay na ibinabahagi ng division ang isang dami o bumubuo ito ng magkakapantay na pangkat. Sinasabi ng sagot kung ilan ang nasa bawat pangkat o ilang pangkat ang mabubuo.', 'Division shares a quantity equally or makes equal groups. The answer tells items per group or how many groups can be made.'),
    guide: text('Share or group the objects equally, then check by multiplying.', 'Ibahagi o ipangkat nang pantay ang mga bagay, saka i-check gamit ang multiplication.', 'Share or group equally, then check using multiplication.'),
  }),
  Object.freeze({
    pattern: /Fraction|Halves and Quarters/,
    explanation: text('A fraction describes equal parts of one whole or equal parts of a group. The bottom number tells the number of equal parts; the top number tells how many parts are chosen.', 'Inilalarawan ng fraction ang magkakapantay na bahagi ng isang buo o pangkat. Sinasabi ng denominator kung ilang pantay na bahagi mayroon at ng numerator kung ilang bahagi ang pinili.', 'A fraction shows equal parts of a whole or group. The denominator tells total equal parts; the numerator tells how many are chosen.'),
    guide: text('Check that every part is equal, count all parts, then count the selected parts.', 'Tiyaking magkakapantay ang mga bahagi, bilangin ang lahat, saka bilangin ang mga napili.', 'Make sure equal ang parts, count all parts, then count the selected parts.'),
  }),
  Object.freeze({
    pattern: /Length|Distance|Perimeter|Area|Mass|Capacity/,
    explanation: text('Measurement compares an object with a chosen unit. Use equal units with no gaps or overlaps, and always name the unit in the result.', 'Inihahambing ng measurement ang isang bagay sa napiling unit. Gumamit ng magkakapantay na unit na walang puwang o patong, at laging isama ang unit sa sagot.', 'Measurement compares an object with a unit. Use equal units with no gaps or overlaps, and always include the unit.'),
    guide: text('Choose the correct measure and unit, calculate carefully, then write the unit with the answer.', 'Piliin ang tamang sukat at unit, kalkulahin nang maingat, saka isulat ang unit kasama ng sagot.', 'Choose the correct measure and unit, calculate carefully, then include the unit.'),
  }),
  Object.freeze({
    pattern: /Pictographs|Bar Graphs|Collecting Data|Probability|Likelihood/,
    explanation: text('Data can be collected, organized, and shown with pictures, tables, or bars. Read the title, labels, and key before comparing the values.', 'Maaaring kolektahin, ayusin, at ipakita ang data gamit ang larawan, table, o bar. Basahin muna ang pamagat, label, at key bago ihambing ang mga halaga.', 'Data can be collected and shown with pictures, tables, or bars. Read the title, labels, and key before comparing values.'),
    guide: text('Read the labels and key, find the needed category, then count or compare its value.', 'Basahin ang mga label at key, hanapin ang kailangang category, saka bilangin o ihambing ang value.', 'Read the labels and key, find the category, then count or compare its value.'),
  }),
  Object.freeze({
    pattern: /Money/,
    explanation: text('Money values depend on the denomination of each coin or bill. Add the values to find a total and subtract to find change or what remains.', 'Nakadepende ang halaga ng pera sa denomination ng bawat coin o bill. Idagdag ang mga halaga para sa kabuuan at magbawas para sa sukli o natira.', 'Money value depends on each coin or bill denomination. Add values for the total and subtract for change or what remains.'),
    guide: text('Identify each denomination, combine the values, and write the peso sign with the amount.', 'Tukuyin ang denomination ng bawat isa, pagsamahin ang mga halaga, at isulat ang peso sign kasama ng halaga.', 'Identify each denomination, combine the values, and write the peso sign with the amount.'),
  }),
  Object.freeze({
    pattern: /Time|Calendar|Elapsed/,
    explanation: text('Clocks and calendars help us place events in order and measure how long they last. Read the correct hand, date, or interval before calculating.', 'Tinutulungan tayo ng clock at calendar na ayusin ang mga pangyayari at sukatin kung gaano katagal ang mga ito. Basahin muna ang tamang kamay, petsa, o pagitan bago kalkulahin.', 'Clocks and calendars help order events and measure duration. Read the correct hand, date, or interval before calculating.'),
    guide: text('Mark the start and end, then count the equal time intervals between them.', 'Markahan ang simula at wakas, saka bilangin ang magkakapantay na pagitan ng oras.', 'Mark the start and end, then count the equal time intervals between them.'),
  }),
  Object.freeze({
    pattern: /Patterns/,
    explanation: text('A pattern follows a rule that repeats or changes in a predictable way. Find the smallest repeating or changing part before continuing it.', 'Ang pattern ay sumusunod sa tuntuning umuulit o nagbabago sa paraang mahuhulaan. Hanapin muna ang pinakamaliit na bahaging umuulit o nagbabago bago ito ituloy.', 'A pattern follows a repeating or changing rule. Find the smallest repeat or change before continuing it.'),
    guide: text('Compare neighboring terms, describe the rule, then apply that same rule once more.', 'Ihambing ang magkatabing term, ilarawan ang rule, saka gamitin muli ang parehong rule.', 'Compare nearby terms, describe the rule, then apply the same rule again.'),
  }),
  Object.freeze({
    pattern: /Lines|Transformations|Turns and Direction/,
    explanation: text('Position and direction describe where something is and how it moves. A slide, turn, or flip changes position or orientation without changing the object itself.', 'Inilalarawan ng position at direction kung nasaan ang isang bagay at paano ito gumagalaw. Binabago ng slide, turn, o flip ang puwesto o orientation nang hindi binabago ang bagay.', 'Position and direction tell where an object is and how it moves. A slide, turn, or flip changes position or orientation, not the object itself.'),
    guide: text('Notice the starting position, follow each movement in order, and check the final position.', 'Tingnan ang panimulang puwesto, sundin ang bawat galaw sa tamang ayos, at i-check ang huling puwesto.', 'Notice the starting position, follow each move in order, then check the final position.'),
  }),
  Object.freeze({
    pattern: /Number Sentences|Mixed Operations/,
    explanation: text('A number sentence uses numbers and operation signs to show a relationship. Keep both sides equal and follow the correct operation order.', 'Gumagamit ang number sentence ng mga numero at operation sign para ipakita ang ugnayan. Panatilihing equal ang magkabilang side at sundin ang tamang order ng operations.', 'A number sentence uses numbers and operation signs para ipakita ang relationship. Keep both sides equal at sundin ang tamang order of operations.'),
    guide: text('Identify the operation signs, solve in the correct order, and check both sides.', 'Tukuyin ang operation signs, magsolve sa tamang order, at i-check ang magkabilang side.', 'Identify the operation signs, solve in the right order, then check both sides.'),
  }),
])

const FALLBACK = Object.freeze({
  explanation: text('Math becomes easier when we model the information, choose the correct operation, and check whether the answer makes sense.', 'Mas nagiging madali ang math kapag mino-model natin ang impormasyon, pinipili ang tamang operation, at tinitiyak na makatuwiran ang sagot.', 'Math becomes easier when we model the information, choose the right operation, and check if the answer makes sense.'),
  guide: text('List what is known, identify what is asked, solve one step at a time, and check the result.', 'Ilista ang nalalaman, tukuyin ang hinahanap, magsolve nang paisa-isang hakbang, at i-check ang resulta.', 'List what is known, identify what is asked, solve step by step, then check the result.'),
})

function findExampleItem(competency) {
  const sourcePrompt = competency.worked_example?.en
  return competency.items?.find((item) => item.q?.en === sourcePrompt) ?? competency.items?.[0] ?? null
}

function hasCuratedExplanation(competency) {
  const explanation = competency.explanation
  return Boolean(explanation?.en && explanation.en !== competency.competency && explanation.taglish !== explanation.en)
}

export function lessonTeaching(competency) {
  const title = topicTitle(competency.ref, competency.competency)
  const rule = RULES.find(({ pattern }) => pattern.test(title)) ?? FALLBACK
  const item = findExampleItem(competency)
  const answer = competency.worked_example_answer ?? text(
    item ? `The answer is ${item.answer}.` : 'Check the result with your teacher.',
    item ? `Ang sagot ay ${item.answer}.` : 'I-check ang resulta kasama ang iyong guro.',
    item ? `Ang answer ay ${item.answer}.` : 'I-check ang result with your teacher.',
  )
  const prompt = competency.worked_example_prompt ?? item?.q ?? competency.worked_example
  const steps = competency.worked_example_steps ?? [rule.guide]

  return Object.freeze({
    explanation: hasCuratedExplanation(competency) ? competency.explanation : rule.explanation,
    example: Object.freeze({
      prompt,
      steps,
      answer,
      teacherLine: competency.worked_example_teacher ?? text(
        'Follow each step and use the visual to see why the answer works.',
        'Sundin ang bawat hakbang at gamitin ang larawan para makita kung bakit tama ang sagot.',
        'Follow each step at gamitin ang visual para makita kung bakit correct ang answer.',
      ),
    }),
  })
}
