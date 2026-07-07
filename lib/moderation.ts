const BLOCKED_TERMS = ['fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap', 'bastard'];

export function containsProfanity(text: string): boolean {
  const normalized = text.toLowerCase();
  return BLOCKED_TERMS.some((term) => normalized.includes(term));
}
