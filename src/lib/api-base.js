// Origin for the Gabay serverless functions.
//
// When the PWA and the functions share an origin this is '' and every call
// stays relative. A static-only host has no functions of its own, so
// VITE_QUESTION_API_BASE points it at the host that serves /api/*. Every
// /api/* caller must use this — a relative fetch there 404s.
export const API_BASE = (import.meta.env?.VITE_QUESTION_API_BASE ?? '').replace(/\/$/, '')

export const apiUrl = (path) => `${API_BASE}${path}`
