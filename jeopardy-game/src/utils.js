// utils.js

/**
 * Filter out questions with links/images
 */
function filterValidQuestions(questions) {
  return questions.filter(
    (q) => !q.question.includes("<a") && q.answer && q.value
  );
}

/**
 * Get all questions grouped by category
 */
function groupByCategory(questions) {
  const grouped = {};
  questions.forEach((q) => {
    if (!grouped[q.category]) grouped[q.category] = [];
    grouped[q.category].push(q);
  });
  return grouped;
}

/**
 * Shuffle an array in-place
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Parse query params to number with default.
 */
function getQueryNumber(param, defaultValue) {
  const params = new URLSearchParams(window.location.search || "");
  const raw = params.get(param);
  const n = Number(raw);
  return Number.isFinite(n) ? n : defaultValue;
}

/**
 * Safe parse of date-ish strings to epoch ms.
 */
function toTimeMs(dateStr) {
  if (!dateStr) return null;
  if (typeof dateStr === "number") return Number.isFinite(dateStr) ? dateStr : null;
  if (dateStr instanceof Date) {
    const t = dateStr.getTime();
    return Number.isFinite(t) ? t : null;
  }
  if (typeof dateStr === "string") {
    // Try Date.parse first
    let t = Date.parse(dateStr);
    if (Number.isFinite(t)) return t;
    // Fallback: handle mm/dd/yy and mm/dd/yyyy
    const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (m) {
      const mm = Number(m[1]);
      const dd = Number(m[2]);
      let yyyy = Number(m[3]);
      if (yyyy < 100) yyyy += yyyy >= 70 ? 1900 : 2000; // crude pivot
      const d = new Date(Date.UTC(yyyy, mm - 1, dd));
      t = d.getTime();
      return Number.isFinite(t) ? t : null;
    }
  }
  return null;
}

/**
 * Weighted sampler from a weight map
 */
class WeightedSampler {
  constructor(weightMap) {
    this.items = Object.keys(weightMap);
    this.weights = this.items.map((k) => Math.max(0, Number(weightMap[k] || 0)));
    this.total = this.weights.reduce((acc, w) => acc + w, 0);
  }
  pick() {
    if (this.total <= 0) return null;
    const r = Math.random() * this.total;
    let acc = 0;
    for (let i = 0; i < this.items.length; i += 1) {
      acc += this.weights[i];
      if (r < acc) return this.items[i];
    }
    return this.items[this.items.length - 1] || null;
  }
}

function chooseNextCategory(sampler, alreadyChosenSet, maxAttempts = 50) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const pick = sampler.pick();
    if (pick && !alreadyChosenSet.has(pick)) return pick;
  }
  return null;
}

/**
 * Compute recency-blended weights
 */
function computeRecencyWeights(baseWeights, mostRecentDateByCategory, options) {
  const alpha = Math.max(0, Math.min(1, Number(options.alpha || 0)));
  const halfLifeDays = Math.max(1, Number(options.halfLifeDays || 1825));
  if (alpha <= 0) return baseWeights;
  const now = Date.now();
  const halfLifeMs = halfLifeDays * 24 * 60 * 60 * 1000;

  const freshness = {};
  let minScore = Infinity;
  let maxScore = -Infinity;
  for (const category of Object.keys(baseWeights)) {
    const d = mostRecentDateByCategory && mostRecentDateByCategory[category];
    const t = toTimeMs(d);
    let score = 0;
    if (t != null) {
      const ageMs = Math.max(0, now - t);
      const ageHalfLives = ageMs / halfLifeMs;
      score = Math.pow(2, -ageHalfLives); // 2^(-age/halfLife)
    }
    freshness[category] = score;
    if (score < minScore) minScore = score;
    if (score > maxScore) maxScore = score;
  }
  const span = maxScore - minScore || 1;
  const normalized = {};
  for (const k of Object.keys(freshness)) {
    normalized[k] = (freshness[k] - minScore) / span;
  }
  const blended = {};
  for (const k of Object.keys(baseWeights)) {
    const base = Math.max(0, Number(baseWeights[k] || 0));
    const rec = normalized[k] != null ? normalized[k] : 0;
    const factor = (1 - alpha) + alpha * rec;
    const w = Math.round(base * factor);
    blended[k] = Math.max(1, w);
  }
  return blended;
}

/**
 * Build most-recent date per category from grouped questions.
 */
function computeMostRecentByCategory(grouped) {
  const out = {};
  for (const [cat, list] of Object.entries(grouped)) {
    let best = null;
    for (const q of list) {
      const t = toTimeMs(q && q.air_date);
      if (t == null) continue;
      if (best == null || t > best) best = t;
    }
    out[cat] = best != null ? new Date(best).toISOString().slice(0, 10) : null;
  }
  return out;
}

/**
 * Get a random Jeopardy board
 * @param {Array} questions - the raw questions from JSON
 * @param {Array} pointValues - the point values to include
 * @param {Number} numCategories - number of categories to select
 */
export function getRandomBoard(questions, pointValues, numCategories = 5) {
  const validQuestions = filterValidQuestions(questions);
  const grouped = groupByCategory(validQuestions);

  // Keep only categories that have all required point values
  const eligibleCategories = Object.keys(grouped).filter((cat) => {
    const values = grouped[cat].map((q) => q.value);
    return pointValues.every((pv) => values.includes(pv));
  });

  if (eligibleCategories.length === 0) return [];

  // Always apply recency boost (no URL params)
  const alpha = 0.5;
  let selectedCategories;
  if (alpha > 0) {
    // Base weights: number of questions per category
    const baseWeightsAll = {};
    for (const cat of Object.keys(grouped)) {
      baseWeightsAll[cat] = grouped[cat].length;
    }
    // Only keep eligible categories in weights
    const baseWeights = {};
    for (const cat of eligibleCategories) {
      baseWeights[cat] = baseWeightsAll[cat] || 1;
    }
    const mostRecent = computeMostRecentByCategory(grouped);
    const halfLifeDays = 1825;
    const weights = computeRecencyWeights(baseWeights, mostRecent, { alpha, halfLifeDays });
    const sampler = new WeightedSampler(weights);
    const chosen = new Set();
    while (chosen.size < Math.min(numCategories, eligibleCategories.length)) {
      const next = chooseNextCategory(sampler, chosen);
      if (!next) break;
      chosen.add(next);
    }
    selectedCategories = Array.from(chosen);
  } else {
    // Original random selection
    shuffleArray(eligibleCategories);
    selectedCategories = eligibleCategories.slice(0, numCategories);
  }

  const board = selectedCategories.map((cat) => {
    const clues = [];
    pointValues.forEach((pv) => {
      // pick a random question with that value
      const possible = grouped[cat].filter((q) => q.value === pv);
      if (possible.length > 0) {
        const question = possible[Math.floor(Math.random() * possible.length)];
        clues.push(question);
      } else {
        clues.push({ value: pv, question: "No question", answer: "" });
      }
    });

    return { category: cat, clues };
  });

  return board;
}

/**
 * Pick a single Final Jeopardy question with recency bias
 */
export function getFinalQuestion(questions) {
  // Filter: require question/answer; exclude HTML links
  const candidates = (questions || []).filter(
    (q) => q && q.question && q.answer && !String(q.question).includes("<a")
  );
  if (candidates.length === 0) return null;

  const alpha = 0.5;
  const halfLifeDays = 1825;
  const now = Date.now();
  const halfLifeMs = halfLifeDays * 24 * 60 * 60 * 1000;

  // Compute normalized recency scores in [0,1]
  const recencyScores = candidates.map((q) => {
    const t = toTimeMs(q.air_date);
    if (t == null) return 0;
    const ageMs = Math.max(0, now - t);
    const ageHalfLives = ageMs / halfLifeMs;
    const score = Math.pow(2, -ageHalfLives);
    return score;
  });
  let minScore = Infinity;
  let maxScore = -Infinity;
  for (const s of recencyScores) {
    if (s < minScore) minScore = s;
    if (s > maxScore) maxScore = s;
  }
  const span = maxScore - minScore || 1;
  const normalized = recencyScores.map((s) => (s - minScore) / span);

  // Blend with uniform baseline via alpha
  const weights = normalized.map((rec) => {
    const factor = (1 - alpha) + alpha * rec;
    // scale to integer weight
    return Math.max(1, Math.round(factor * 1000));
  });

  // Sample one
  const map = {};
  for (let i = 0; i < candidates.length; i += 1) {
    // Use index keys to preserve mapping
    map[String(i)] = weights[i];
  }
  const sampler = new WeightedSampler(map);
  const key = sampler.pick();
  const idx = key != null ? Number(key) : 0;
  return candidates[Math.max(0, Math.min(candidates.length - 1, idx))] || candidates[0];
}
