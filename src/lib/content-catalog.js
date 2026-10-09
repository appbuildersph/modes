import grade4 from '../curriculum/grade4.json' with { type: 'json' }
import grade5 from '../curriculum/grade5.json' with { type: 'json' }
import grade6 from '../curriculum/grade6.json' with { type: 'json' }
import { applyCurriculumOverrides } from './curriculum-overrides.js'

// Gabay covers Grades 4-6. The Grade 1-3 MATATAG files are still in
// src/curriculum/ but are deliberately not imported, so they are not bundled.
const ALL = applyCurriculumOverrides([...grade4, ...grade5, ...grade6])

export const getAllContent = () => ALL
export const getContentByGrade = (grade) => ALL.filter((competency) => competency.grade === Number(grade))
export const getContentByRef = (ref) => ALL.find((competency) => competency.ref === ref)
