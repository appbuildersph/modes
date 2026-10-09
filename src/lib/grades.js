// Gabay's scope: Grades 4-6 of the DepEd MATATAG mathematics curriculum.
// Every grade picker, storage key, and API validator reads from here.
export const GRADES = [4, 5, 6]
export const MIN_GRADE = GRADES[0]
export const MAX_GRADE = GRADES[GRADES.length - 1]
export const DEFAULT_GRADE = 6

export const isSupportedGrade = (value) =>
  Number.isInteger(value) && value >= MIN_GRADE && value <= MAX_GRADE
