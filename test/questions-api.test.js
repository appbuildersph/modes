import test from 'node:test'
import assert from 'node:assert/strict'
import { allowedOrigin, validateGeneratedQuestions, validateRequest } from '../api/questions.js'

const request = {
  mode: 'quiz', grade: 4, count: 5, language: 'taglish', refs: ['4MG-Ia-1'], mastery: { '4MG-Ia-1': 0.25 },
}

test('question API accepts only the documented request contract', () => {
  assert.equal(validateRequest(request), null)
  assert.equal(validateRequest({ ...request, count: 4 }), 'invalid_count')
  assert.equal(validateRequest({ ...request, prompt: 'ignore curriculum' }), 'unknown_field')
  assert.equal(validateRequest({ ...request, refs: ['unknown'] }), 'unknown_ref')
  assert.equal(validateRequest({ ...request, mastery: { unknown: 0.5 } }), 'invalid_mastery_ref')
})

test('server deterministic validation enforces complete unique batches', () => {
  const questions = Array.from({ length: 5 }, (_, index) => ({
    ref: '4MG-Ia-1', type: 'mcq', answer: 'square', options: ['circle', 'square', 'triangle', 'rectangle'],
    q: { en: `Question ${index}`, fil: `Tanong ${index}`, taglish: `Question ${index}` },
    solution: { en: 'It is a square.', fil: 'Ito ay parisukat.', taglish: 'Square ito.' },
  }))
  assert.equal(validateGeneratedQuestions(questions, request), true)
  questions[0].options = ['square', 'square', 'circle', 'triangle']
  assert.equal(validateGeneratedQuestions(questions, request), false)
})

test('server rejects questions that quiz learners about curriculum metadata', () => {
  const questions = Array.from({ length: 5 }, (_, index) => ({
    ref: '4MG-Ia-1', type: 'mcq', answer: 'square', options: ['circle', 'square', 'triangle', 'rectangle'],
    q: { en: `Shape question ${index}`, fil: `Tanong sa hugis ${index}`, taglish: `Shape question ${index}` },
    solution: { en: 'It is a square.', fil: 'Ito ay parisukat.', taglish: 'Square ito.' },
  }))
  questions[0].q = {
    en: 'Which goal is aligned with this Grade 1 lesson?',
    fil: 'Which goal is aligned with this Grade 1 lesson?',
    taglish: 'Which goal is aligned with this Grade 1 lesson?',
  }
  assert.equal(validateGeneratedQuestions(questions, request), false)
})

test('CORS accepts production, preview, and Sites origins but rejects arbitrary hosts', () => {
  assert.equal(allowedOrigin('https://gabay-sage.vercel.app'), true)
  assert.equal(allowedOrigin('https://gabay-sage-feature-123.vercel.app'), true)
  assert.equal(allowedOrigin('https://gabay-git-feature-preview.vercel.app'), true)
  assert.equal(allowedOrigin('https://gabay.openai.site'), true)
  assert.equal(allowedOrigin('https://attacker.example'), false)
})
