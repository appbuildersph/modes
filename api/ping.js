// Cheap connectivity probe (Vercel Function, Node runtime).
//
// navigator.onLine and the window online/offline events don't fire when
// DevTools' Network throttling dropdown is set to "Offline" — that preset
// only blocks requests at the network layer. The client polls this endpoint
// to detect that case; it does no work so polling it costs nothing.
export default function handler(req, res) {
  res.status(204).end()
}
