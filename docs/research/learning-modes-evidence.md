# Learning modes: subjects to tackle and the evidence behind them

Prepared 10 October 2026 for the AppBuildersPH 2026 team. Papers were found through Google Scholar, IEEE Xplore and ScienceDirect (searched with the Crossref, OpenAlex and Semantic Scholar indexes), and every DOI below was checked against its Crossref record. Competency codes come from Gabay's MATATAG curriculum files (`src/curriculum/grade1.json` to `grade6.json`). Mode definitions are in `docs/TUTOR_MODES.md`. Working notes and the abstracts behind every number are in `docs/research/learning-modes-evidence/`.

## Summary

Each mode should start with the topics where its learners' main barrier sits. Each mode's design rules mix research-backed choices with untested inferences, and the pitch should say which is which.

- **Kalma (ADHD, autism, sensory sensitivity):** start with short, single-step items that keep a visual model on screen: place value, naming fractions, fractions on a number line, clock systems. Split multi-step word problems into one step per screen. Defer MDAS and GMDAS order of operations, composite-figure perimeter and dense data problems. The plain-screen rule has the clearest support: young children learned less in a heavily decorated classroom (Fisher et al., 2014).
- **Pakinig (dyslexia, low vision, weak readers):** start with word problems and number words read aloud, and defer visual-only items such as protractors, reflections and graphs. Read-aloud helps students with disabilities more than other students, but its gains in math are small (Li, 2014; Buzick & Stone, 2014). Letter spacing helps readers with dyslexia; special dyslexia fonts do not (Zorzi et al., 2012; Wery & Diliberto, 2016; Kuster et al., 2017).
- **Hakbang (dyscalculia, intellectual disability):** start in Grade 1 number sense, money and clock time, then addition and subtraction with models. Defer dissimilar fractions and fraction multiplication. Explicit, systematic instruction is the best-supported practice (Gersten et al., 2009; Browder et al., 2008). Digital interventions show a mean effect of 0.55 (Benavides-Varela et al., 2020).
- **Untested:** the 2-sentence reply cap, 5-question sessions, word highlighting as a separate feature, one-step-plus-check delivered by an LLM, and Filipino child speech recognition for numbers. Describe the modes as "designed to support" and make no efficacy claims.

## How to read this report

- **Source tags** in brackets say where to open each source: ScienceDirect, IEEE Xplore, ACM Digital Library, ISCA Archive, Google Scholar (other publishers), preprint (not peer reviewed), official page, or news.
- **Status labels** in the rule tables:
  - **Supported:** a verified study tests this or something very close.
  - **Mixed:** the evidence points both ways, or holds only partly.
  - **Inference:** our reasoning from related evidence.
  - **Untested:** no study was found.
- **Numbers** come only from abstracts we read or from official pages. When an abstract was not available, the source is cited for its topic only.
- **Years** follow Crossref, so an article published online in late 2016 and in print in 2017 shows as 2016.

## Kalma (Calm/Focus): ADHD, autism and sensory sensitivity

### What the research says

**ADHD.** In a small study of children with ADHD, math performance and on-task behaviour improved during computer-assisted instruction compared with independent seatwork [Google Scholar: Mautone et al., 2005]. A randomized trial also compared two computer-based interventions for students with attention difficulties [Google Scholar: Rabiner et al., 2009]. Its abstract was not available, so this report uses it for background only.

**Autism.**
- A meta-analysis of 13 studies found that autistic participants (n = 533) scored lower in math than typically developing peers (n = 525), with a small-to-medium effect (g = 0.49). Age, verbal intellectual functioning and working memory moderated the gap [ScienceDirect: Tonizzi & Usai, 2023].
- About a quarter of learners with autism have a mathematics learning disability. A meta-analysis of 33 intervention studies found moderate to large single-case effects (Tau-U .91) for 5 approaches: multiple representations, video modeling, schema-based instruction, drill and practice, and multi-component packages [Google Scholar: Karal & Riccomini, 2024].
- A comprehensive review identified evidence-based practices for autistic children and youth, among them visual supports, prompting, time delay, task analysis, and technology-aided instruction and intervention [Google Scholar: Wong et al., 2015].

**Screen environment.**
- Kindergarten children taught 6 science lessons in a laboratory classroom were more distracted, spent more time off task and learned less when the walls were heavily decorated than when the decorations were removed [Google Scholar: Fisher et al., 2014].
- Two related sources could not be checked against an abstract, so they appear here for their topic only. A meta-analysis studied the "seductive detail" effect, where interesting but irrelevant material is added to lessons [ScienceDirect: Rey, 2012]. Another meta-analysis covers sensory modulation symptoms in autism [Google Scholar: Ben-Sasson et al., 2008].
- WCAG 2.2 requires that nothing flashes more than 3 times in one second (2.3.1). Moving content that starts by itself and lasts more than 5 seconds needs a way to pause it (2.2.2) [official page: W3C WCAG 2.2].

### Subjects to tackle in Kalma

| Priority | Competency (code, description, tier) | Why |
|---|---|---|
| Tackle first | 4NA-Ie-2: place value and value of a digit in a 6-digit number (katamtaman) | Single answer per item; base-ten visuals keep it concrete (Inference) |
| Tackle first | 4NA-IIe-1: identify proper fractions, improper fractions and mixed numbers (madali) | Short items with a model; multiple representations are among the effective approaches for autistic learners (Karal & Riccomini, 2024) |
| Tackle first | 4NA-IIe-3: plot fractions with denominators 2, 4, 5 and 10 on the number line (madali) | Number line estimation is linked to broader math competence, more strongly for fractions (Schneider et al., 2018) |
| Tackle first | 5MG-Ia-1: describe a 12- and 24-hour clock system (madali) | Short, predictable, everyday skill (Inference) |
| Tackle with adaptation | 4NA-Ii-1: multi-step problems with the four operations up to 1 000 000, including money (mahirap) | Show one step per screen, with a check before the next. Working memory moderates the math gap in autism (Tonizzi & Usai, 2023); the adaptation itself is Inference |
| Tackle with adaptation | 4NA-IIa-1: represent situations using a number sentence (madali) | Name the problem type before solving; schema-based instruction is one of the effective approaches (Karal & Riccomini, 2024) |
| Tackle with adaptation | 4NA-IIf-1: add and subtract similar fractions (katamtaman) | Keep the fraction model on screen and fade it slowly (Inference) |
| Avoid or defer | 4NA-IIa-2: two or more operations using MDAS (mahirap); 5NA-Ic-1: three or more operations using GMDAS (mahirap) | Several steps held in mind at once (Inference) |
| Avoid or defer | 4MG-Id-2: perimeter of composite figures (mahirap) | Dense figures with several sub-steps (Inference) |
| Avoid or defer | 4SP-IIIf-2: problems using data in a table or line graph (mahirap) | Busy displays; bring back later with simplified tables (Inference) |

### Kalma design and tutor rules

| Rule | Status | Evidence |
|---|---|---|
| Plain background; no doodles, sparkles or 3D | Supported (indirect) | Decorated walls led to more off-task time and smaller learning gains (Fisher et al., 2014). The study used kindergarten children in general, not children with ADHD or autism |
| No music, coins or rewards | Mixed | The seductive-detail research is about removing irrelevant additions (Rey, 2012). No study was found that removes rewards for ADHD or autistic learners in math |
| One question per screen | Inference | Follows from the working-memory findings; not tested directly |
| Same layout every time | Inference | Visual supports and technology-aided instruction are evidence-based for autism (Wong et al., 2015); layout consistency itself was not tested |
| No "Correct!" flash and no shake | Inference | Matches WCAG 2.3.1 and 2.2.2; no learning study found |
| Calm, neutral tone | Untested | No study was found on tutor feedback tone for these learners |
| Replies of at most 2 short sentences with 1 idea | Inference | Working-memory reasoning; not tested with LLM tutors |
| About 5 questions per session | Untested | No study was found that sets a session length |

## Pakinig (Listen): dyslexia, low vision and weak readers

### What the research says

**Co-occurring conditions.** A study of up to 19,125 twins and 2,150 siblings in the Netherlands, assessed at ages 7 and 10, examined ADHD, dyslexia and dyscalculia [Google Scholar: van Bergen et al., 2025].
- Children with one of these conditions were 2.1 to 3.1 times more likely to have a second.
- Still, 77.3% had only one.
- The conditions co-occur because of correlated genetic risks, not because one causes another.
- So many Pakinig users will have no math disability, and their barrier is reading the item (Inference).

**Read-aloud and text-to-speech.**
- One meta-analysis pooled 114 effect sizes from 23 studies [Google Scholar: Li, 2014]:
  - Read-aloud helped students with and without disabilities, and helped students with disabilities significantly more.
  - The effect was stronger in reading than in math.
  - It was stronger when human proctors read the test than when video or audio players or computers did.
- A second meta-analysis found that math gains from read-aloud are small for both groups, with some evidence of larger effects in elementary school [Google Scholar: Buzick & Stone, 2014].
- For reading comprehension, text-to-speech and related read-aloud tools gave an average weighted effect of d = .35 (95% CI .14 to .56) for students with reading difficulties [Google Scholar: Wood et al., 2017].

**Typography.**
- Extra-large letter spacing improved text reading on the spot, without training, in a large unselected sample of Italian and French children with dyslexia [Google Scholar: Zorzi et al., 2012].
- In elementary students with dyslexia, OpenDyslexic did not improve reading rate or accuracy compared with Arial and Times New Roman, for individuals or for the group [Google Scholar: Wery & Diliberto, 2016].
- Children with dyslexia (n = 170) did not read faster or more accurately in the Dyslexie font than in Arial, and most preferred Arial [Google Scholar: Kuster et al., 2017].

**Accessibility requirements.** WCAG 2.2 sets a minimum text contrast of 4.5:1 at AA (1.4.3) and 7:1 at AAA (1.4.6). It also requires that text keeps working when users widen letter, word and line spacing (1.4.12) [official page: W3C WCAG 2.2]. These are requirements, not evidence of learning gains.

**Voice answers.** Child speech is still hard for speech recognition.
- For Filipino children's speech, the best system trained with data augmentation on the Tagalog ISIP06 corpus reached an 11.72% word error rate, a 43.55% relative improvement over its baseline [IEEE Xplore: Abion et al., 2023].
- A recognizer for children with autism and language impairment reached 26.21% at best [ISCA Archive: Gale et al., 2019].

### Subjects to tackle in Pakinig

| Priority | Competency (code, description, tier) | Why |
|---|---|---|
| Tackle first | 4NA-Ie-1: read and write numbers up to 1 000 000 in numerals and in words (madali) | Number words are easy to hear and to say back (Inference) |
| Tackle first | 4NA-Ii-1: multi-step problems with the four operations up to 1 000 000, including money (mahirap) | Word problems carry the reading load that read-aloud removes. The benefit is larger for students with disabilities (Li, 2014) but small in math (Buzick & Stone, 2014), so wording must also be written for listening |
| Tackle first | 5NA-IIc-1: multi-step problems adding or subtracting decimals, including money (mahirap) | Same reason; peso amounts are easy to say (Inference) |
| Tackle first | 4MG-IId-1: conversion problems for length, mass, capacity and time, including elapsed time (mahirap) | Word problems whose units can be spoken (Inference) |
| Tackle with adaptation | 4NA-IIe-1: identify proper fractions, improper fractions and mixed numbers (madali) | Speak fractions as words ("three fourths") (Inference) |
| Tackle with adaptation | 4NA-IIa-1: represent situations using a number sentence (madali) | Speak symbols as words ("times", "equals") (Inference) |
| Tackle with adaptation | 6NA-IIb-1: problems involving ratio and proportion (mahirap) | Speak ratios as "3 is to 4" (Inference) |
| Avoid or defer | 4MG-Ia-1: illustrate angles using models (madali); 4MG-Ia-2: measure and draw angles using a protractor (madali) | Needs sight and a drawing tool; skip with a notice or give a spoken description (Inference) |
| Avoid or defer | 4MG-IIId-3: draw the image of an object after a reflection (katamtaman) | Visual-only (Inference) |
| Avoid or defer | 4SP-IIIe-2: present data in a table or a single line graph (madali) | Visual-only output (Inference) |
| Avoid or defer | 6MG-IIIb-1: measure the circumference of circles using tools (madali) | Needs physical measuring (Inference) |

### Pakinig design and tutor rules

| Rule | Status | Evidence |
|---|---|---|
| Automatic read-aloud of the question | Mixed | Helps more in reading than in math (Li, 2014; Buzick & Stone, 2014). Text-to-speech gives d = .35 for reading comprehension (Wood et al., 2017) |
| Word highlighting during read-aloud | Inference | No verified study in this search tests highlighting on its own |
| Wide letter spacing | Supported | Zorzi et al. (2012) |
| Atkinson Hyperlegible font | Untested | No peer-reviewed study was found. Special dyslexia fonts did not help (Wery & Diliberto, 2016; Kuster et al., 2017), so present the font as a legibility choice, not a dyslexia treatment |
| High-contrast black question panel | WCAG requirement | 4.5:1 (AA) and 7:1 (AAA) |
| Slower speech with a speed control (0.65x to 1x) | Untested | No study was found on speech rate for these learners |
| Voice answers, with typing still available | Inference | Child speech recognition still has high error rates (Abion et al., 2023; Gale et al., 2019), so keep typing and read back what was heard ("Heard three fourths, so 3/4") |
| Replies with no symbols ("three fourths", not "3/4") | Inference | Follows from listening; not tested |
| Skip picture-only items with a notice | Inference | Visual-only items cannot be answered by listening |

## Hakbang (Step): dyscalculia and intellectual disability

### What the research says

**Core deficits.** Children with severe dyscalculia (n = 58), compared with matched controls (n = 42), showed deficits in both symbolic and nonsymbolic number sense. A digit-comparison task and a numerosity match-to-sample task told the groups apart (area under the curve .84) [Google Scholar: Decarli et al., 2022].

**Instruction for learning disabilities.**
- A meta-analysis of 42 interventions for students with learning disabilities found significant mean effects from 0.21 to 1.56 for most instructional components [Google Scholar: Gersten et al., 2009].
- Explicit instruction and teaching heuristics gave the largest practical gains.
- Number line estimation correlates with broader math competence (r = .443; 263 effect sizes; 10,576 participants aged 4 to 14), more strongly for fractions [Google Scholar: Schneider et al., 2018]. This is a correlation, not a training effect.

**Significant cognitive disabilities.**
- A meta-analysis of 68 experiments found that most studies taught counting, calculation, number matching or money. It found strong evidence for systematic instruction and for teaching in real settings [Google Scholar: Browder et al., 2008].
- A follow-up review of 29 more studies supports systematic instruction, in vivo instruction, the system of least prompts, constant time delay and task-analytic instruction [Google Scholar: Hudson et al., 2018].

**Digital programs.**
- Across 15 randomized studies with 1,073 participants, digital interventions improved math performance (mean effect 0.55). Games gave no extra advantage over drill and tutoring programs, and the effect did not differ between primary school and preschool [ScienceDirect: Benavides-Varela et al., 2020].
- **Calcularis:**
  - A pilot with 32 children (20 minutes a day, 5 days a week, for 6 to 12 weeks) found gains in number representation and arithmetic [Google Scholar: Käser et al., 2013].
  - A randomized trial with 67 children with dyscalculia in Grades 2 to 5 (at least 42 sessions of 20 minutes within 13 weeks) found larger gains in arithmetic and number line estimation than a waiting control, still present 3 months later [Google Scholar: Kohn et al., 2020].
- **The Number Race:** an open trial with 9 children aged 7 to 9 (30 minutes a day, 4 days a week, for 5 weeks) found the following [Google Scholar: Wilson et al., 2006b]:
  - Subitizing and number comparison became several hundred milliseconds faster.
  - Subtraction accuracy rose by 23%.
  - Addition and base-ten understanding did not improve.
- **Kalcal:** a small study of the mobile app Kalcal (children aged 7 to 12, four 1-hour sessions, pre-test and post-test, no control group) is weak evidence [IEEE Xplore: Dehghani, 2019].

**Practice guide.** The IES practice guide "Assisting Students Struggling with Mathematics: Intervention in the Elementary Grades" is a practical companion for the Hakbang step design [official page: IES What Works Clearinghouse].

### Subjects to tackle in Hakbang

| Priority | Competency (code, description, tier) | Why |
|---|---|---|
| Tackle first | 1NA-Ib-1: count up to 100, including 1 more and 1 less (madali) | Number sense is the core deficit (Decarli et al., 2022) |
| Tackle first | 1NA-Ic-1: read and write numerals up to 100 (madali) | Links symbols to quantities (Decarli et al., 2022) |
| Tackle first | 1NA-Id-1: represent numbers up to 100 with concrete and pictorial models, including the number line (madali) | Concrete first; number line link (Schneider et al., 2018) |
| Tackle first | 1NA-IIb-2: place value of a digit in a 2-digit number (katamtaman) | Needed before regrouping (Inference) |
| Tackle first | 1NA-IIIe-1: recognize coins and bills up to PHP 100 (madali) | Money is the most-studied functional skill (Browder et al., 2008) |
| Tackle first | 1MG-IIIi-1: read and write time to the hour, half hour and quarter hour on an analog clock (madali) | Everyday skill (Inference) |
| Tackle with adaptation | 1NA-Ih-1: addition with sums up to 20 using concrete and pictorial models (madali) | One step at a time with blocks, then fade them (Inference) |
| Tackle with adaptation | 1NA-IIi-1: subtraction within 20 using concrete and pictorial models, "taking away" (katamtaman) | Matches the mockup's bibingka item: count all, take away, count what is left |
| Tackle with adaptation | 1NA-IIf-1: addition with sums up to 100 without regrouping, using models (katamtaman) | Base-ten blocks on screen (Inference) |
| Tackle with adaptation | 1NA-IIIc-1: illustrate 1/2 and 1/4 as parts of a whole (madali) | Shaded shapes or bibingka slices before symbols (Inference) |
| Tackle with adaptation | 1NA-IIIf-1: value of a set of bills and coins up to PHP 100 (katamtaman) | Real peso images; systematic instruction (Browder et al., 2008) |
| Avoid or defer | 4NA-IIg-2: compare dissimilar fractions using =, > and < (katamtaman) | Needs secure fraction magnitude first (Inference) |
| Avoid or defer | 4NA-IIIb-1: add and subtract dissimilar fractions (mahirap) | Several procedures at once (Inference) |
| Avoid or defer | 5NA-Ic-2: multiply fractions using models (katamtaman) | Needs fraction understanding first (Inference) |
| Avoid or defer | 4NA-IIa-2: two or more operations using MDAS (mahirap) | Several rules at once (Inference) |

Suggested order: 1NA-Ib-1, 1NA-Ic-1, 1NA-Id-1, 1NA-IIb-2, 1NA-Ih-1, 1NA-IIi-1, 1NA-IIf-1, 1NA-IIIe-1, 1NA-IIIf-1, 1MG-IIIi-1, 1NA-IIIc-1, 1NA-IIIc-2. After that, move to the matching Grade 2 and 3 competencies before returning to Grade 4 items. The order is our inference, built on the number-sense findings above.

### Hakbang design and tutor rules

| Rule | Status | Evidence |
|---|---|---|
| Concrete visuals first (blocks, number lines) | Inference | Multiple representations are effective for autistic learners (Karal & Riccomini, 2024), and number lines relate to math competence (Schneider et al., 2018). The concrete-first order itself was not isolated |
| One step per reply, then a check question | Inference | Built on supported practices: explicit instruction (Gersten et al., 2009), systematic instruction, prompting and time delay (Browder et al., 2008; Hudson et al., 2018). Not tested as an LLM behaviour |
| Money and time early | Supported for money; Inference for time | Money is the most-studied measurement skill (Browder et al., 2008) |
| Easy tier and Grade 1 to 3 content | Inference | Number-sense deficits (Decarli et al., 2022) suggest starting at the foundations |
| Drill-style practice instead of game mechanics | Supported | Games gave no extra advantage over drill and tutoring programs (Benavides-Varela et al., 2020) |
| Simple words and concrete Filipino examples | Untested | No study was found |

## Philippine context

- **Curriculum:** MATATAG started in SY 2024-2025 with Kindergarten and Grades 1, 4 and 7, and DepEd says it is fully implemented in SY 2026-2027. Every grade from 1 to 6 uses it this school year [official page: DepEd FAQ on DO 010, s. 2024].
- **PISA 2022:** Filipino 15-year-olds averaged 355 in mathematics, 347 in reading and 356 in science, against OECD averages of 472, 476 and 485 [news: Philstar, 6 December 2023, reporting OECD results].
- **TIMSS 2019:** in Grade 4 mathematics the Philippines scored 297, the lowest of the 58 participating countries [news: ABS-CBN and GMA News; the IEA report confirms 58 countries].
- **Language:** Republic Act 12027 lapsed into law on 10 October 2024. It ends the mother tongue as the medium of instruction from Kindergarten to Grade 3, reverts to Filipino and English, keeps regional languages as auxiliary media, and makes the mother tongue optional in monolingual classes [official page: lawphil.net]. A listening mode therefore needs good Filipino and English voices (Inference).
- **Learners with disabilities:** the EDCOM 2 policy brief of 22 November 2025, prepared with IDinsight and DepEd, reports [news: The POST, reporting the brief]:
  - 391,089 learners with disabilities were enrolled in public schools in SY 2024-2025, 8% of an estimated 5.1 million children with disabilities.
  - 61% are categorized only by observable manifestations, without formal assessment.
  - 60% have no access to any special needs education resource.
  - 32 former SPED centers have been designated as Inclusive Learning Resource Centers, and none is fully operational.
- **Implications:** most learners never get a formal assessment, so modes that a teacher or parent chooses as preferences, with no diagnosis, fit the situation (Inference).

## AI tutor and speech technology

- **LLM tutors:**
  - In a preprint, adults and K-12 educators rated LLM-written tutoring responses for third and fourth graders as more effective, engaging and responsive than human tutors' responses when authorship was held constant. The same responses were rated lower when labelled as AI [preprint: Ozernov-Palchik et al., 2026].
  - Another preprint describes agent-based checks and retrieval to reduce LLM hallucination [preprint: Wang & Duan, 2025].
  - A survey of conversational agents for neurodevelopmental disorders maps their design features, therapeutic goals and evaluation methods, and lists open gaps [ACM Digital Library: Catania et al., 2023].
  - No study was found that measures math accuracy of an on-device model such as Gemma on DepEd items. The team's plan to enforce mode rules in code and check numeric answers in code is the right safeguard to describe (Inference).
- **Speech:**
  - For Filipino child speech recognition, the best result is the 11.72% word error rate reported by Abion et al. (2023) [IEEE Xplore].
  - Voice conversion that adds child-like training speech cut word error rates by about 3 points absolute for fine-tuned Conformer and Whisper models [ISCA Archive: Zhang et al., 2024].
  - A "machine speech chain" lets recognition and synthesis train each other for code-switched speech, which is relevant to Taglish [IEEE Xplore: Nakayama et al., 2019].
  - No study was found on Taglish math speech or on word timing for highlighted read-aloud in Filipino.

## Existing apps: use cases to learn from

| App | Designed for | Evidence (verified) | What Gabay can borrow | Where Gabay differs |
|---|---|---|---|---|
| EndeavorRx (AKL-T01) | Children aged 8 to 12 with ADHD; attention | Randomized trial with 348 children. The game was played 25 minutes a day, 5 days a week, for 4 weeks. Mean change on an attention test (TOVA API) was 0.93 against 0.03 for control, with no serious adverse events (Kollins et al., 2020) | Short, fixed daily sessions | It trains attention, not math |
| Calcularis | Children with dyscalculia | A pilot (Käser et al., 2013) and a randomized trial with 67 children (Kohn et al., 2020) | An adaptive learner model and number line training | Gabay is a talking tutor, aligned to MATATAG, in Filipino and English, and offline |
| The Number Race | Children with dyscalculia | Open trial with 9 children (Wilson et al., 2006b) | Adaptive number comparison practice | A single game, not a tutor |
| onebillion (onecourse) | Early numeracy, including low-resource schools | In Malawi, 318 children (283 analysed), Standards 1 to 3, about 30 minutes a day for 8 weeks; the math tablet beat both control groups in Standards 2 and 3 (Pitchford, 2015). In the UK, 133 pupils aged 4 to 7 showed immediate and lasting gains, especially low achievers (Outhwaite et al., 2017) | Offline tablet design grounded in a curriculum | Not organised around learner needs or modes |
| Microsoft Immersive Reader | Reading support | No peer-reviewed effectiveness study was found in this search | Read-aloud with word highlighting | Not a math tutor |
| ModMath | Students with dyslexia or dysgraphia | No peer-reviewed study was found | Math layout without handwriting | Not audio-first and not a tutor |

In this search we found no app that combines an offline, on-device AI tutor, learner-selectable modes, Filipino and English or Taglish, and MATATAG alignment.

## Other websites the team can use

| Site | Good for | Example search |
|---|---|---|
| ERIC | Education research database run by the US Department of Education | https://eric.ed.gov/?q=%22learning+disabilities%22+mathematics+%22computer+assisted+instruction%22 |
| PubMed | Health and psychology studies on ADHD, autism and dyslexia | https://pubmed.ncbi.nlm.nih.gov/?term=ADHD+mathematics+children |
| ACM Digital Library | HCI and accessibility research (ASSETS, CHI, IDC) | https://dl.acm.org/action/doSearch?AllField=children+learning+disabilities+math+tutor |
| Semantic Scholar | Free search with citation links | https://www.semanticscholar.org/search?q=dyscalculia%20intervention |
| OpenAlex | Free open index; its API returns abstracts | https://api.openalex.org/works?search=dyscalculia%20intervention |
| CORE | Open-access full texts | https://core.ac.uk/search?q=dyscalculia |
| Philippine E-Journals | Philippine journals, including education and SPED | https://ejournals.ph/ |
| PIDS | Philippine policy research | https://www.pids.gov.ph/ |
| DepEd LRMDS | MATATAG learning resources | https://lrmds.deped.gov.ph/ |
| IES What Works Clearinghouse | Practice guide for students struggling with math | https://ies.ed.gov/ncee/wwc/PracticeGuide/26 |
| NCII | Reviews of intervention tools | https://intensiveintervention.org/tools-charts/overview |
| NCAEP | Autism evidence-based practices | https://ncaep.fpg.unc.edu/ |
| IRIS Center | Free modules on special education practices | https://iris.peabody.vanderbilt.edu/ |
| CAST UDL Guidelines | Universal Design for Learning | https://udlguidelines.cast.org/ |
| EEF Teaching and Learning Toolkit | Evidence summaries by teaching approach | https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit |
| W3C WCAG 2.2 quick reference | Accessibility requirements | https://www.w3.org/WAI/WCAG22/quickref/ |
| W3C COGA "Making Content Usable" | Design patterns for cognitive and learning disabilities | https://www.w3.org/TR/coga-usable/ |
| Understood.org | Plain-language guides on learning and thinking differences | https://www.understood.org/ |
| Reading Rockets | Reading and dyslexia guidance for teachers | https://www.readingrockets.org/ |

## Search links for Google Scholar, IEEE Xplore and ScienceDirect

**Google Scholar**

- [ADHD mathematics computer-assisted instruction](https://scholar.google.com/scholar?q=ADHD+mathematics+computer-assisted+instruction)
- [read-aloud accommodation meta-analysis mathematics](https://scholar.google.com/scholar?q=read-aloud+accommodation+meta-analysis+mathematics)
- [dyscalculia digital intervention meta-analysis](https://scholar.google.com/scholar?q=dyscalculia+digital+intervention+meta-analysis)
- [learners with disabilities Philippines mathematics](https://scholar.google.com/scholar?q=learners+with+disabilities+Philippines+mathematics)

**IEEE Xplore**

- [Filipino speech recognition children](https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=Filipino%20speech%20recognition%20children)
- [serious game dyscalculia](https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=serious%20game%20dyscalculia)
- [text-to-speech dyslexia](https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=text-to-speech%20dyslexia)
- [autism mathematics application](https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=autism%20mathematics%20application)

**ScienceDirect**

- [autism mathematics intervention](https://www.sciencedirect.com/search?qs=autism%20mathematics%20intervention)
- [digital intervention mathematical learning difficulties](https://www.sciencedirect.com/search?qs=digital%20intervention%20mathematical%20learning%20difficulties)
- [seductive details meta-analysis](https://www.sciencedirect.com/search?qs=seductive%20details%20meta-analysis)
- [ADHD mathematics achievement](https://www.sciencedirect.com/search?qs=ADHD%20mathematics%20achievement)

## Gaps and next steps

**Gaps found in this search:**

- No study tests LLM tutors that give one step plus a check question, or replies capped at 2 sentences, with children in any of these groups.
- No study measures Gemma or another on-device model's math accuracy on DepEd items.
- No study measures recognition of spoken Filipino numbers and fractions by children, or word timing for highlighted Filipino read-aloud.
- There is no Philippine prevalence data for ADHD, autism, dyslexia or dyscalculia in this search.

**Next steps:**

- In the pitch, say the modes are "designed to support" these learners. Name the evidence for each mode, and call the untested rules design choices still to be tested.
- Pick demo items from the "Tackle first" rows:
  - Kalma: 4NA-IIe-3.
  - Pakinig: a 4NA-Ii-1 money word problem.
  - Hakbang: the bibingka subtraction, which matches 1NA-IIi-1.
- Keep typed answers next to voice answers, and check numeric answers in code.
- After the hackathon, run a pilot with teacher-referred learners in inclusive or SPED classes, with parental consent and school approval:
  - Collect no diagnoses.
  - Measure item accuracy, completion, time on task and which mode learners prefer.

## References

Years and details come from each DOI's Crossref record.

**ScienceDirect**

- Tonizzi, I., Usai, M.C. (2023). Math abilities in autism spectrum disorder: A meta-analysis. Research in Developmental Disabilities, 139, 104559. https://doi.org/10.1016/j.ridd.2023.104559
- Benavides-Varela, S., Zandonella Callegher, C., Fagiolini, B., et al. (2020). Effectiveness of digital-based interventions for children with mathematical learning difficulties: A meta-analysis. Computers & Education, 157, 103953. https://doi.org/10.1016/j.compedu.2020.103953
- Outhwaite, L.A., Gulliford, A., Pitchford, N.J. (2017). Closing the gap: Efficacy of a tablet intervention to support the development of early mathematical skills in UK primary school children. Computers & Education, 108, 43-58. https://doi.org/10.1016/j.compedu.2017.01.011
- Rey, G.D. (2012). A review of research and a meta-analysis of the seductive detail effect. Educational Research Review, 7(3), 216-237. https://doi.org/10.1016/j.edurev.2012.05.003
- Kollins, S.H., DeLoss, D.J., Cañadas, E., et al. (2020). A novel digital intervention for actively reducing severity of paediatric ADHD (STARS-ADHD): a randomised controlled trial. The Lancet Digital Health, 2(4), e168-e178. https://doi.org/10.1016/s2589-7500(20)30017-0

**IEEE Xplore**

- Abion, C., Lumapag, N.C., Ramirez, J.C., et al. (2023). Comparison of Data Augmentation Techniques on Filipino ASR for Children's Speech. 2023 International Conference on Speech Technology and Human-Computer Dialogue (SpeD). https://doi.org/10.1109/sped59241.2023.10314952
- Nakayama, S., Tjandra, A., Sakti, S., et al. (2019). Zero-Shot Code-Switching ASR and TTS with Multilingual Machine Speech Chain. 2019 IEEE Automatic Speech Recognition and Understanding Workshop (ASRU). https://doi.org/10.1109/asru46091.2019.9003926
- Dehghani, H. (2019). The effectiveness of a mobile application "Kalcal" on the learning of mathematics in students with dyscalculia. 2019 International Serious Games Symposium (ISGS). https://doi.org/10.1109/isgs49501.2019.9047035

**ACM Digital Library**

- Catania, F., Spitale, M., Garzotto, F. (2023). Conversational Agents in Therapeutic Interventions for Neurodevelopmental Disorders: A Survey. ACM Computing Surveys, 55(10), 1-34. https://doi.org/10.1145/3564269

**ISCA Archive (open access, also on Google Scholar)**

- Gale, R., Chen, L., Dolata, J., et al. (2019). Improving ASR Systems for Children with Autism and Language Impairment Using Domain-Focused DNN Transfer Techniques. Interspeech 2019. https://doi.org/10.21437/interspeech.2019-3161
- Zhang, Y., Yue, Z., Patel, T., et al. (2024). Improving child speech recognition with augmented child-like speech. Interspeech 2024. https://doi.org/10.21437/interspeech.2024-485

**Google Scholar (SAGE, Springer, Wiley, Frontiers, PNAS, AERA, BMC)**

- Mautone, J.A., DuPaul, G.J., Jitendra, A.K. (2005). The Effects of Computer-Assisted Instruction on the Mathematics Performance and Classroom Behavior of Children With ADHD. Journal of Attention Disorders, 9(1), 301-312. https://doi.org/10.1177/1087054705278832
- Rabiner, D.L., Murray, D.W., Skinner, A.T., et al. (2009). A Randomized Trial of Two Promising Computer-Based Interventions for Students with Attention Difficulties. Journal of Abnormal Child Psychology, 38(1), 131-142. https://doi.org/10.1007/s10802-009-9353-x
- Fisher, A.V., Godwin, K.E., Seltman, H. (2014). Visual Environment, Attention Allocation, and Learning in Young Children. Psychological Science, 25(7), 1362-1370. https://doi.org/10.1177/0956797614533801
- Ben-Sasson, A., Hen, L., Fluss, R., et al. (2008). A Meta-Analysis of Sensory Modulation Symptoms in Individuals with Autism Spectrum Disorders. Journal of Autism and Developmental Disorders, 39(1), 1-11. https://doi.org/10.1007/s10803-008-0593-3
- Wong, C., Odom, S.L., Hume, K.A., et al. (2015). Evidence-Based Practices for Children, Youth, and Young Adults with Autism Spectrum Disorder: A Comprehensive Review. Journal of Autism and Developmental Disorders, 45(7), 1951-1966. https://doi.org/10.1007/s10803-014-2351-z
- Karal, M.A., Riccomini, P.J. (2024). Meta-Analysis of Mathematics Interventions for Learners with Autism Spectrum Disorder. Education and Training in Autism and Developmental Disabilities, 59(3), 257-273. https://doi.org/10.1177/215416472405900303
- van Bergen, E., de Zeeuw, E.L., Hart, S.A., et al. (2025). Co-Occurrence and Causality Among ADHD, Dyslexia, and Dyscalculia. Psychological Science, 36(3), 204-217. https://doi.org/10.1177/09567976241293999
- Li, H. (2014). The Effects of Read-Aloud Accommodations for Students With and Without Disabilities: A Meta-Analysis. Educational Measurement: Issues and Practice, 33(3), 3-16. https://doi.org/10.1111/emip.12027
- Buzick, H., Stone, E. (2014). A Meta-Analysis of Research on the Read Aloud Accommodation. Educational Measurement: Issues and Practice, 33(3), 17-30. https://doi.org/10.1111/emip.12040
- Wood, S.G., Moxley, J.H., Tighe, E.L., et al. (2017). Does Use of Text-to-Speech and Related Read-Aloud Tools Improve Reading Comprehension for Students With Reading Disabilities? A Meta-Analysis. Journal of Learning Disabilities, 51(1), 73-84. https://doi.org/10.1177/0022219416688170
- Zorzi, M., Barbiero, C., Facoetti, A., et al. (2012). Extra-large letter spacing improves reading in dyslexia. Proceedings of the National Academy of Sciences, 109(28), 11455-11459. https://doi.org/10.1073/pnas.1205566109
- Wery, J.J., Diliberto, J.A. (2016). The effect of a specialized dyslexia font, OpenDyslexic, on reading rate and accuracy. Annals of Dyslexia, 67(2), 114-127. https://doi.org/10.1007/s11881-016-0127-1
- Kuster, S.M., van Weerdenburg, M., Gompel, M., et al. (2017). Dyslexie font does not benefit reading in children with or without dyslexia. Annals of Dyslexia, 68(1), 25-42. https://doi.org/10.1007/s11881-017-0154-6
- Decarli, G., Sella, F., Lanfranchi, S., et al. (2022). Severe Developmental Dyscalculia Is Characterized by Core Deficits in Both Symbolic and Nonsymbolic Number Sense. Psychological Science, 34(1), 8-21. https://doi.org/10.1177/09567976221097947
- Gersten, R., Chard, D.J., Jayanthi, M., et al. (2009). Mathematics Instruction for Students With Learning Disabilities: A Meta-Analysis of Instructional Components. Review of Educational Research, 79(3), 1202-1242. https://doi.org/10.3102/0034654309334431
- Schneider, M., Merz, S., Stricker, J., et al. (2018). Associations of Number Line Estimation With Mathematical Competence: A Meta-analysis. Child Development, 89(5), 1467-1484. https://doi.org/10.1111/cdev.13068
- Hudson, M.E., Rivera, C.J., Grady, M.M. (2018). Research on Mathematics Instruction with Students with Significant Cognitive Disabilities: Has Anything Changed? Research and Practice for Persons with Severe Disabilities, 43(1), 38-53. https://doi.org/10.1177/1540796918756601
- Browder, D.M., Spooner, F., Ahlgrim-Delzell, L., et al. (2008). A Meta-Analysis on Teaching Mathematics to Students with Significant Cognitive Disabilities. Exceptional Children, 74(4), 407-432. https://doi.org/10.1177/001440290807400401
- Käser, T., Baschera, G.M., Kohn, J., et al. (2013). Design and evaluation of the computer-based training program Calcularis for enhancing numerical cognition. Frontiers in Psychology, 4, 489. https://doi.org/10.3389/fpsyg.2013.00489
- Kohn, J., Rauscher, L., Kucian, K., et al. (2020). Efficacy of a Computer-Based Learning Program in Children With Developmental Dyscalculia. What Influences Individual Responsiveness? Frontiers in Psychology, 11, 1115. https://doi.org/10.3389/fpsyg.2020.01115
- Wilson, A.J., Dehaene, S., Pinel, P., et al. (2006a). Principles underlying the design of "The Number Race", an adaptive computer game for remediation of dyscalculia. Behavioral and Brain Functions, 2, 19. https://doi.org/10.1186/1744-9081-2-19
- Wilson, A.J., Revkin, S.K., Cohen, D., et al. (2006b). An open trial assessment of "The Number Race", an adaptive computer game for remediation of dyscalculia. Behavioral and Brain Functions, 2, 20. https://doi.org/10.1186/1744-9081-2-20
- Pitchford, N.J. (2015). Development of early mathematical skills with a tablet intervention: a randomized control trial in Malawi. Frontiers in Psychology, 6, 485. https://doi.org/10.3389/fpsyg.2015.00485

**Preprints (not peer reviewed)**

- Ozernov-Palchik, O., Catania, F., Gabrieli, J., et al. (2026). Large Language Model-Generated Tutoring Responses Receive Higher Ratings but Are Penalized by Source-Based Evaluation Bias. PsyArXiv (OSF). https://doi.org/10.31234/osf.io/stek7_v1
- Wang, J., Duan, Z. (2025). Controlling Large Language Model Hallucination Based on Agent AI with LangGraph. Cambridge Open Engage. https://doi.org/10.33774/coe-2025-xkwl5

**Official pages**

- DepEd. FAQs on the MATATAG Curriculum (DO 010, s. 2024). https://deped.gov.ph/wp-content/uploads/FAQs-ON-THE-MATATAG-CURRICULUM.pdf
- Republic Act No. 12027 (2024). https://lawphil.net/statutes/repacts/ra2024/ra_12027_2024.html
- W3C. Web Content Accessibility Guidelines (WCAG) 2.2. https://www.w3.org/WAI/WCAG22/quickref/
- IES What Works Clearinghouse. Assisting Students Struggling with Mathematics: Intervention in the Elementary Grades. https://ies.ed.gov/ncee/wwc/PracticeGuide/26
- IEA. TIMSS 2019 International Results in Mathematics and Science. https://timss2019.org/reports/achievement/

**News**

- Philstar (6 December 2023). Philippines still lags behind world in math, reading and science: PISA 2022. https://philstar.com/headlines/2023/12/06/2316732/philippines-still-lags-behind-world-math-reading-and-science-pisa-2022
- ABS-CBN News (9 December 2020). PH ranks last among 58 countries in Grade 4 math, science: study. https://abs-cbn.com/news/12/09/20/ph-ranks-last-among-58-countries-in-grade-4-math-science-study
- GMA News (December 2020). Philippines lowest out of 58 countries in 4th grade math, science international study. https://www.gmanetwork.com/news/topstories/nation/767542/philippines-lowest-out-of-58-countries-in-4th-grade-math-science-int-l-study/story/
- The POST (2025). EDCOM 2 study warns 5M Filipino children with disabilities still underserved. https://thepost.net.ph/news/nation/edcom-2-study-warns-5m-filipino-children-with-disabilities-still-underserve/
