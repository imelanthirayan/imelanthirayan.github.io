// ============================================================
// script.js: Shared utilities for Vector Index Visual Explorer
// ============================================================

/**
 * Cosine Similarity
 * Measures how similar two vectors are by looking at the angle between them.
 *
 *   Score = 1.0  → vectors point in the same direction (very similar)
 *   Score = 0    → vectors are perpendicular (unrelated)
 *   Score = -1   → vectors point in opposite directions
 *
 * Formula:  similarity = dot(a, b) / (|a| × |b|)
 */
function cosineSimilarity(a, b) {
  // Step 1: Dot product: multiply matching positions and add them up
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);

  // Step 2: Magnitude (length) of each vector: square root of sum of squares
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));

  // Step 3: Guard against dividing by zero
  if (magA === 0 || magB === 0) return 0;

  // Step 4: Divide dot product by product of magnitudes
  return dot / (magA * magB);
}

/**
 * Read a 3D vector from three input elements.
 * Elements must have IDs:  prefix + "0", prefix + "1", prefix + "2"
 * Example: readVec("q") reads ids "q0", "q1", "q2"
 */
function readVec(prefix) {
  return [0, 1, 2].map(i => {
    const el = document.getElementById(prefix + i);
    return el ? (parseFloat(el.value) || 0) : 0;
  });
}

/**
 * Format a number to 4 decimal places (e.g. 0.9827)
 */
function f4(n) {
  return Number(n).toFixed(4);
}

/**
 * Build a progress-bar percentage string clamped to 0–100
 */
function pct(score, max) {
  if (max === 0) return '0%';
  return (Math.max(0, score / max) * 100).toFixed(1) + '%';
}

/**
 * Input field Tailwind classes: used consistently on every page
 */
const INPUT_CLS =
  'w-20 border-2 border-indigo-200 rounded-lg px-2 py-1 text-center ' +
  'font-mono text-sm focus:outline-none focus:border-indigo-500 bg-white';

/**
 * Global guard: prevent any number input from going negative.
 * Uses capture phase so the clamp runs before each page's own oninput handler,
 * ensuring calc/onVecChange always sees a non-negative value.
 */
document.addEventListener('input', function(e) {
  if (e.target.type === 'number') {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val < 0) {
      e.target.value = 0;
    }
  }
}, true);
