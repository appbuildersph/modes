// Origin for the Gabay serverless functions.
//
// On Vercel the PWA and the functions share an origin, so this is '' and every
// call stays relative. A Sites build (openai.site) is static-only and has no
// functions of its own, so VITE_QUESTION_API_BASE points it back at the Vercel
// deployment. Every /api/* caller must use this — a relative fetch there 404s,
// which silently killed the tutor, cloud TTS, and voice-in.
export const API_BASE = (import.meta.env?.VITE_QUESTION_API_BASE ?? '').replace(/\/$/, '')

export const apiUrl = (path) => `${API_BASE}${path}`
