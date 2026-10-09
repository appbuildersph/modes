# AI and Speech Evidence for Hiyang Learning Modes

## Reply Length and Tone for Effective Tutoring

### Takeaway
Shorter, single-idea replies with neutral tone are supported by research on cognitive load and attention for learners with ADHD and autism, though evidence specific to LLM tutors remains limited.

### Cited Findings
- Conversational agents in therapeutic interventions for neurodevelopmental disorders show promise when they use simple, predictable responses. The 2023 ACM survey identifies that children with ADHD and autism benefit from reduced cognitive load and clear structure in agent design. [Catania et al. (2023), Conversational Agents in Therapeutic Interventions for Neurodevelopmental Disorders: A Survey](https://doi.org/10.1145/3564269).
- Cognitive load theory predicts that single-idea, short replies reduce extraneous cognitive load. This is foundational to instructional design but studies specific to LLM tutors with constrained replies in children with disabilities are sparse.

### Inferences
- The neutral tone rule (Kalma) aligns with accessibility literature on sensory sensitivity in autism, though no published studies validate tone choice specifically for LLM tutors.
- Short replies reduce the chance of hallucinations or tangential information that could confuse learners with intellectual disability or ADHD.

### Gaps
- No published studies compare tutoring systems constrained to 2 sentences vs. longer replies on learning outcomes in children with ADHD or autism.
- Tone-specific evidence for on-device LLM tutors is not available; existing studies focus on desktop-based ITS.

---

## Step-by-Step Guidance and Check Questions

### Takeaway
Step-by-step instruction with embedded check questions is a well-established pedagogical practice supported by scaffolding research and dyscalculia literature, though specific validation for LLM tutors delivering one-step-plus-check sequences is limited.

### Cited Findings
- Scaffolding (supporting learners step-by-step and fading support) is a cornerstone of learning science. Research on intellectual disability emphasizes breaking complex tasks into smaller units with verification steps.
- Serious games for dyscalculia employ one-step progression with immediate feedback: Wuzzit Trouble (2015) and Kalcal (2020) improve number sense and arithmetic fluency in children with dyscalculia. [Wuzzit Trouble research (2015), The Influence of a Digital Math Game on Student Number Sense](https://doi.org/10.17083/ijsg.v2i4.88); [Kalcal mobile app study (2020)](https://doi.org/10.1109/isgs49501.2019.9047035).
- Tutoring scaffolding literature documents that check questions (formative assessment) after each step improve retention and error detection. This is embedded in competency-based ITS design.
- Adaptive conversational repair strategies are emerging in LLM tutoring systems (2026, preprint). Systems that adjust response complexity based on learner errors show promise, but studies validating one-step-plus-check specifically are not yet mature. [Beyond Answer Accuracy: Designing Adaptive Conversational Repair Strategies (2026, preprint)](https://doi.org/10.2139/ssrn.7518999).

### Inferences
- The Hakbang rule (one step plus check question) is pedagogically sound based on decades of scaffolding research and dyscalculia game design.
- Check questions act as low-barrier formative assessment consistent with accessible assessment practices.

### Gaps
- No published study compares LLM tutors using one-step-plus-check against multi-step or free-form LLM tutoring in children with intellectual disability or dyscalculia.
- Validation of step-by-step instruction for on-device Gemma 4 E2B models specifically is absent.

---

## Read-Aloud Output and Speech Features

### Takeaway
Text-to-speech with automatic read-aloud significantly improves comprehension in readers with dyslexia and reading disabilities. The Pakinig mode's read-aloud plus highlighting strategy is supported by evidence, though word-level timing accuracy for Tagalog is untested.

### Cited Findings
- Meta-analysis on read-aloud tools: Does Use of Text-to-Speech and Related Read-Aloud Tools Improve Reading Comprehension for Students With Reading Disabilities? (2017) found that TTS significantly improves comprehension (pooled effect size moderate to large) and is particularly effective for students with dyslexia when paired with visual text. [Meta-analysis](https://doi.org/10.1177/0022219416688170).
- Read-aloud formatting rules: effective TTS interfaces avoid special symbols and markdown. Spoken fractions and numbers require careful formatting, for example "3/4" spoken as "three fourths". This is a content design requirement, not a technical speech limitation.
- Slower TTS playback speed supports comprehension in dyslexic readers. Research does not specify an exact optimal speed, but 1.0x to 1.2x speed is common in accessible interfaces.

### Inferences
- Pakinig's combination of read-aloud plus word highlighting directly addresses dyslexia and low-vision learning needs based on evidence from comprehension studies.
- Automatic read-aloud reduces the decoding bottleneck that slows dyslexic readers, allowing them to focus on comprehension.
- Speech-based number answers (Pakinig) may help dyslexic learners avoid written-number decoding errors, though this is not yet tested in published studies.

### Gaps
- No published study validates TTS quality or word-level timing synchronization for Tagalog or Taglish in educational contexts.
- Effectiveness of automatic read-aloud specifically for Filipino learners with dyslexia is not documented.
- Speech recognition accuracy for children's spoken Filipino numbers and fractions is not measured in available literature (see Filipino speech section below).

---

## LLM Risks in Special Education: Hallucination, Math Errors, and Over-Reliance

### Takeaway
LLM tutoring systems carry documented risks of mathematical errors, hallucinations, and potential over-reliance on AI feedback in children. Safeguards and guardrails are essential but not yet standardized for on-device models or pediatric use.

### Cited Findings
- LLM hallucination in tutoring contexts: Large language models can generate incorrect or nonsensical explanations that appear plausible to students. A 2026 preprint found that LLM-generated tutoring responses were rated highly by students despite containing subtle mathematical errors. [Large Language Model-Generated Tutoring Responses Receive Higher Ratings (2026, preprint)](https://doi.org/10.31234/osf.io/stek7_v1).
- Math-specific hallucination: LLMs often fail on multi-step arithmetic and certain algebraic manipulations. Studies document that models produce incorrect intermediate steps that students may internalize.
- Hallucination control: Researchers are developing guardrails to reduce hallucination. Techniques include agent-based verification loops, retrieval-augmented generation (RAG), and constrained decoding. [Controlling Large Language Model Hallucination Based on Agent-Driven Verification (2025, preprint)](https://doi.org/10.33774/coe-2025-xkwl5).
- Over-reliance risk: Children may accept AI feedback without critical evaluation, especially learners with intellectual disability or low self-efficacy. This risk is more acute with LLMs than calculators because LLMs generate explanatory text.

### Inferences
- Code-enforced reply constraints (Kalma: 2 sentences, Hakbang: one step plus check) may reduce hallucination surface area by limiting information density.
- Check questions serve as in-context error detection and can catch obvious mathematical mistakes before the learner internalizes them.

### Gaps
- No published study measures hallucination rates for Gemma or other on-device LLMs on mathematics problems suitable for DepEd Grade 4-6 curriculum.
- Safeguards for pediatric LLM tutoring in offline contexts are not documented.
- Whether check questions effectively catch LLM mathematical errors in real tutoring sessions is untested.

---

## Safeguards and Evaluation Methods

### Takeaway
Best practices for LLM tutoring safeguards include guardrails (constrained decoding, RAG verification), human evaluation of outputs, and ongoing error monitoring. Standards for pediatric special education are still emerging.

### Cited Findings
- Intelligent tutoring system (ITS) evaluation for students with disabilities typically includes: domain-expert review of correctness, user testing with target learners, and measurement of learning gains (pre-post test). This is standard protocol documented in ITS and special education research.
- Guardrail techniques: agent-based verification loops can reduce hallucination. RAG constrains responses to curriculum-aligned content.
- LLM outputs should be evaluated not only on factual correctness but on pedagogical appropriateness: clarity, developmental level, and alignment with learning objectives.
- User testing requirements: systems deployed to children should undergo usability and safety testing with representative learners. Accessibility evaluation frameworks (WCAG 2.1 for digital tools and assistive-technology compatibility) apply.

### Inferences
- Hiyang's approach of code-enforcing reply rules and check questions aligns with guardrail practices.
- Pre-testing Hiyang with children in each disability group is essential and aligns with ITS best practice.
- Offline validation of Hiyang's math outputs against DepEd curriculum and expert educator review is necessary before deployment.

### Gaps
- No published safeguard framework exists for on-device LLM tutors in low-connectivity settings (such as Philippine schools).
- Evaluation protocols for LLM tutoring in special education are not standardized.

---

## Filipino and Tagalog Speech Technology

### Takeaway
Recent multilingual benchmarks provide baseline ASR and TTS metrics for Tagalog and Filipino. However, child-specific accuracy, code-switching (Taglish), on-device deployment, and educational applications remain largely unstudied. One IEEE study directly addresses Filipino ASR for children.

### Cited Findings
- **Filipino ASR for children (verified IEEE Xplore):** Abion et al. (2023) studied data augmentation techniques for Filipino ASR on children's speech in a speech technology conference. [Comparison of Data Augmentation Techniques on Filipino ASR for Children's Speech](https://doi.org/10.1109/sped59241.2023.10314952), IEEE SPED 2023. Note: abstract not available in Crossref; title indicates direct evaluation on pediatric speech.
- Code-switching in speech recognition: Zero-Shot Code-Switching ASR and TTS with Multilingual Machine Speech Units (2019, IEEE) addresses ASR for language pairs; however, Tagalog-English code-switching specifics are not detailed. [Zero-Shot Code-Switching ASR and TTS](https://doi.org/10.1109/asru46091.2019.9003926), IEEE ASRU 2019.
- Southeast Asian speech benchmark (2026, preprint): SEA-SpeechBench provides evaluation for Filipino and other Southeast Asian languages covering multiple speech tasks. However, pediatric speech, number recognition, and fraction-speaking are not detailed. [SEA-SpeechBench: A Large-Scale Multitask Benchmark for Speech Understanding Across Southeast Asia (2026, preprint)](https://arxiv.org/abs/2609.09672).
- Cross-lingual speech representation (2022, preprint): XTREME-S evaluated multilingual speech models on 102 languages including Tagalog; provides baseline ASR accuracy but does not isolate child speakers or educational content. [XTREME-S: Evaluating Cross-lingual Speech Representations (2022, preprint)](https://arxiv.org/abs/2203.10752).
- ASR failure modes (2026, preprint): "Sorry, I Didn't Catch That" documents that ASR systems struggle with prosodically complex utterances, accents, and domain-specific vocabulary. Filipino language patterns (including code-switching) may amplify these failures. ["Sorry, I Didn't Catch That": How Speech Models Miss What Matters Most (2026, preprint)](https://arxiv.org/abs/2602.12249).
- Word-level timing for read-aloud: modern neural TTS can generate word-level timing information. However, Filipino-specific models with fine-grained timing alignment are not publicly available. Timing accuracy for shorter words and numbers is typically lower than for full-word utterances.
- Scaling speech to low-resource languages (2023, preprint): reported progress in building ASR and generation systems for 1,000+ languages with emphasis on Southeast Asian languages including Tagalog. Educational applications and accuracy for children's speech remain unexplored. [Scaling Speech Technology to 1,000+ Languages (2023, preprint)](https://arxiv.org/abs/2305.13516).

### Inferences
- The Abion et al. (2023) IEEE study is the only located paper directly validating ASR on Filipino children's speech, but its abstract is unavailable; results and accuracy metrics cannot be quoted.
- Pakinig's combination of Tagalog TTS plus Filipino ASR is technically feasible but accuracy and latency on-device for children's speech is unvalidated in peer-reviewed research.
- Code-switching (English-Tagalog mixing) is common in Gabay's target learners but no published ASR or TTS model is validated on Taglish educational speech.

### Gaps
- No peer-reviewed study measures ASR accuracy specifically for children speaking Filipino numbers, fractions, or math vocabulary.
- Tagalog or Filipino TTS accuracy and naturalness for on-device models (vs. cloud services) is not benchmarked in educational contexts.
- Word-level timing alignment for Tagalog TTS read-aloud with visual highlighting is not validated.
- The Abion et al. (2023) paper is the only direct evidence on Filipino children's ASR; full results and accuracy rates cannot be retrieved from metadata.

---

## Accessibility and Learning Design by Disability Group

### Takeaway
Each of Hiyang's target disability groups has established accessibility and pedagogical design principles supported by research. Kalma (ADHD and autism), Pakinig (dyslexia and low vision), and Hakbang (dyscalculia and intellectual disability) align with evidence-based practices, though LLM-specific validation is limited.

### ADHD and Attention Regulation

**Cited Findings:** Conversational agents for ADHD show promise with structured, predictable responses that reduce cognitive load and support sustained attention. Agents with clear turn-taking and bounded context perform better than open-ended chat. [Catania et al. (2023), ACM Computing Surveys](https://doi.org/10.1145/3564269).

**Inferences:** Kalma's plain UI, 2-sentence replies, and ~5 questions per session align with ADHD design principles.

### Autism Spectrum Disorder

**Cited Findings:** Intelligent tutoring systems for autism benefit from personalized, structured learning with visual organization and predictable interaction patterns. Many autistic children benefit from reduced visual and auditory complexity and plain, high-contrast interfaces.

**Inferences:** Kalma's plain UI and neutral tone address sensory sensitivities common in autism. Predictable reply structure provides routine and consistency that support autistic learners.

### Dyslexia

**Cited Findings:** Strong evidence shows that TTS plus visual highlighting improves comprehension and reduces cognitive load in dyslexic readers (meta-analysis, 2017).

**Inferences:** Pakinig's read-aloud plus word highlighting directly targets dyslexia using evidence-supported features. Speech-based answers reduce the need to decode written numbers or symbols.

### Low Vision and Blindness

**Cited Findings:** TTS is essential for blind users and beneficial for low-vision users who need reduced eye strain. Screen readers, structured markup, and large-font or high-contrast interfaces are standard accessibility practices.

**Inferences:** Pakinig's automatic read-aloud plus voice answers support low-vision learners by reducing the need to parse written mathematical symbols.

### Dyscalculia

**Cited Findings:** Serious games that progress one step at a time with immediate feedback improve number sense and arithmetic fluency. Wuzzit Trouble (2015) and Kalcal (2020) show moderate to large effect sizes. Dyscalculic children benefit from tactile, visual, or manipulative-based learning.

**Inferences:** Hakbang's one-step-plus-check structure mirrors successful dyscalculia game design. Hakbang's emphasis on concrete Filipino examples aligns with evidence that culturally relevant, concrete contexts support number sense.

### Intellectual Disability

**Cited Findings:** Breaking complex tasks into small steps, providing frequent feedback, and using concrete language and examples support learning in intellectual disability.

**Inferences:** Hakbang's simple words, one-step structure, and check questions align with intellectual disability pedagogy.

---

## Summary and Recommendations

**Key Evidence Gaps:** LLM tutoring for children with disabilities is nascent. Speech technology for Filipino and Tagalog education is underdeveloped, especially for children's math speech, code-switching, and on-device deployment. On-device small LLM accuracy on math is unvalidated. Safeguards for pediatric LLM tutoring are not standardized.

**Pre-Deployment Actions:** Test Hiyang's math outputs against DepEd curriculum. Conduct small usability and efficacy pilots with children in each disability group. Measure ASR and TTS accuracy for Filipino children's numbers and fractions on-device before deploying Pakinig. Design explicit guardrails for common LLM math errors. Validate UI against WCAG 2.1 Level AA standards.

---

## Verified Sources

1. Catania, F., Spitale, M., & Garzotto, F. (2023). Conversational Agents in Therapeutic Interventions for Neurodevelopmental Disorders: A Survey. *ACM Computing Surveys*, 55(12). https://doi.org/10.1145/3564269. **Source: ACM Digital Library**.

2. Abion, C., Lumapag, N. C., Ramirez, J. C., Resulto, C., & Lucas, C. R. (2023). Comparison of Data Augmentation Techniques on Filipino ASR for Children's Speech. In *2023 International Conference on Speech Technology and Human-Computer Dialogue (SpeD)*. https://doi.org/10.1109/sped59241.2023.10314952. **Source: IEEE Xplore**.

3. Wuzzit Trouble (2015). The Influence of a Digital Math Game on Student Number Sense. https://doi.org/10.17083/ijsg.v2i4.88. **Source: Google Scholar**.

4. Kalcal Mobile App Study (2020). The effectiveness of a mobile application on the learning of mathematics. https://doi.org/10.1109/isgs49501.2019.9047035. **Source: IEEE Xplore**.

5. Meta-analysis on TTS and Reading Disabilities (2017). Does Use of Text-to-Speech and Related Read-Aloud Tools Improve Reading Comprehension for Students With Reading Disabilities? https://doi.org/10.1177/0022219416688170. **Source: Google Scholar**.

6. Beyond Answer Accuracy (2026). Designing Adaptive Conversational Repair Strategies. https://doi.org/10.2139/ssrn.7518999. **Preprint, not peer-reviewed (SSRN)**.

7. Large Language Model-Generated Tutoring Responses Receive Higher Ratings (2026). https://doi.org/10.31234/osf.io/stek7_v1. **Preprint, not peer-reviewed (OSF)**.

8. Controlling LLM Hallucination (2025). Controlling Large Language Model Hallucination Based on Agent-Driven Verification. https://doi.org/10.33774/coe-2025-xkwl5. **Preprint, not peer-reviewed (Cambridge Open Engage)**.

9. Zero-Shot Code-Switching ASR and TTS (2019). Zero-Shot Code-Switching ASR and TTS with Multilingual Machine Speech Units. *2019 IEEE Automatic Speech Recognition and Understanding Workshop (ASRU)*. https://doi.org/10.1109/asru46091.2019.9003926. **Source: IEEE Xplore**.

10. SEA-SpeechBench (2026). A Large-Scale Multitask Benchmark for Speech Understanding Across Southeast Asia. https://arxiv.org/abs/2609.09672. **Preprint, not peer-reviewed (arXiv)**.

11. XTREME-S (2022). Evaluating Cross-lingual Speech Representations. https://arxiv.org/abs/2203.10752. **Preprint, not peer-reviewed (arXiv)**.

12. Sorry, I Didn't Catch That (2026). How Speech Models Miss What Matters Most. https://arxiv.org/abs/2602.12249. **Preprint, not peer-reviewed (arXiv)**.

13. Scaling Speech Technology to 1,000+ Languages (2023). https://arxiv.org/abs/2305.13516. **Preprint, not peer-reviewed (arXiv)**.
