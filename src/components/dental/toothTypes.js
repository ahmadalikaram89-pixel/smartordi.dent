// Universal Numbering System (1-32), wie im bestehenden Schema verwendet.
const TOOTH_TYPES = {
  1: 'molar', 2: 'molar', 3: 'molar', 4: 'premolar', 5: 'premolar',
  6: 'canine', 7: 'incisor', 8: 'incisor', 9: 'incisor', 10: 'incisor',
  11: 'canine', 12: 'premolar', 13: 'premolar', 14: 'molar', 15: 'molar', 16: 'molar',
  17: 'molar', 18: 'molar', 19: 'molar', 20: 'premolar', 21: 'premolar',
  22: 'canine', 23: 'incisor', 24: 'incisor', 25: 'incisor', 26: 'incisor',
  27: 'canine', 28: 'premolar', 29: 'premolar', 30: 'molar', 31: 'molar', 32: 'molar',
}

export function getToothType(n) {
  return TOOTH_TYPES[n] || 'incisor'
}

export function isUpperTooth(n) {
  return n <= 16
}

export function isMolarTooth(n) {
  return getToothType(n) === 'molar'
}

// Bildschirm-Reihenfolge links -> rechts (aus Sicht des Behandlers, Patient gegenüber):
// Oberkiefer 1..16, Unterkiefer 32..17 (liegt direkt unter der Oberkiefer-Spalte).
export const UPPER_TEETH = Array.from({ length: 16 }, (_, i) => i + 1)
export const LOWER_TEETH = Array.from({ length: 16 }, (_, i) => 32 - i)
