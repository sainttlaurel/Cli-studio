// A deliberately simple, client-side profanity filter — matches the
// roadmap's "light moderation from day one" scope for the Feedback Wall.
// This is a basic word-list check, not a robust solution: it catches
// casual slip-ups, not determined abuse. It's intentionally limited to
// generic profanity rather than slurs or targeted-harassment terms —
// extend BLOCKED_TERMS with whatever your own moderation policy needs.
// If real moderation demands grow, a hosted moderation API is a better
// investment than expanding this list indefinitely.

const BLOCKED_TERMS = ['fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap', 'bastard'];

export function containsProfanity(text: string): boolean {
  const normalized = text.toLowerCase();
  return BLOCKED_TERMS.some((term) => normalized.includes(term));
}