/* global fetch, document, window */
(function () {
  'use strict';

  function getEmbeddedQuestionBank() {
    const el = document.getElementById('question-bank');
    if (!el) return null;
    const txt = (el.textContent || '').trim();
    if (!txt) return null;
    try {
      return JSON.parse(txt);
    } catch (_) {
      return null;
    }
  }

  /**
   * Parse query params with defaults.
   */
  function getQueryNumber(param, defaultValue) {
    const params = new URLSearchParams(window.location.search || '');
    const raw = params.get(param);
    const n = Number(raw);
    return Number.isFinite(n) ? n : defaultValue;
  }

  /**
   * Safe parse of an ISO-like date string to epoch ms.
   */
  function toTimeMs(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const t = Date.parse(dateStr);
    return Number.isFinite(t) ? t : null;
  }

  /**
   * Given base integer weights and a map of category->mostRecentDate (ISO string),
   * return new integer weights that bias toward more recent categories.
   * - alpha: blend (0..1). 0 = original weights, 1 = fully recency-driven
   * - halfLifeDays: exponential half-life in days for freshness scoring
   */
  function computeRecencyWeightedWeights(baseWeights, mostRecentDateByCategory, options) {
    const alpha = Math.max(0, Math.min(1, Number(options.alpha || 0)));
    const halfLifeDays = Math.max(1, Number(options.halfLifeDays || 1825)); // ~5 years default
    if (alpha <= 0) return baseWeights;
    const now = Date.now();
    const halfLifeMs = halfLifeDays * 24 * 60 * 60 * 1000;

    // Compute freshness scores using exponential decay on age
    const freshness = {};
    let minScore = Infinity;
    let maxScore = -Infinity;
    for (const category of Object.keys(baseWeights)) {
      const d = mostRecentDateByCategory && mostRecentDateByCategory[category];
      const t = toTimeMs(d);
      // If no date, treat as oldest (near zero freshness)
      let score = 0;
      if (t != null) {
        const ageMs = Math.max(0, now - t);
        const ageHalfLives = ageMs / halfLifeMs;
        // exp(-ln(2) * age / half-life) == 2^(-age/halfLife)
        score = Math.pow(2, -ageHalfLives);
      }
      freshness[category] = score;
      if (score < minScore) minScore = score;
      if (score > maxScore) maxScore = score;
    }

    // Normalize to [0,1] to avoid scale sensitivity; handle flat case
    const span = maxScore - minScore || 1;
    const normalized = {};
    for (const k of Object.keys(freshness)) {
      normalized[k] = (freshness[k] - minScore) / span;
    }

    // Blend base weights with recency scores
    const blended = {};
    for (const k of Object.keys(baseWeights)) {
      const base = Math.max(0, Number(baseWeights[k] || 0));
      const rec = normalized[k] != null ? normalized[k] : 0;
      const factor = (1 - alpha) + alpha * rec;
      const w = Math.round(base * factor);
      blended[k] = Math.max(1, w); // ensure non-zero to keep category reachable
    }
    return blended;
  }

  /**
   * Build the recency-aware weights based on available metadata.
   * Supports either:
   *  - data.categoryMostRecentAirDate: { [category]: 'YYYY-MM-DD' }
   *  - data.categoryDates: { [category]: ['YYYY-MM-DD', ...] } -> uses most recent
   */
  function maybeApplyRecencyWeighting(baseWeights, data) {
    const alpha = getQueryNumber('recencyBoost', 0); // 0..1 suggested
    if (!(alpha > 0)) return baseWeights;

    // Construct most-recent date map from supported shapes
    let mostRecent = null;
    if (data && data.categoryMostRecentAirDate && typeof data.categoryMostRecentAirDate === 'object') {
      mostRecent = data.categoryMostRecentAirDate;
    } else if (data && data.categoryDates && typeof data.categoryDates === 'object') {
      mostRecent = {};
      for (const [cat, dates] of Object.entries(data.categoryDates)) {
        if (Array.isArray(dates) && dates.length > 0) {
          // pick max date
          let best = null;
          for (const s of dates) {
            const t = toTimeMs(s);
            if (t == null) continue;
            if (best == null || t > best) best = t;
          }
          mostRecent[cat] = best != null ? new Date(best).toISOString().slice(0, 10) : null;
        } else {
          mostRecent[cat] = null;
        }
      }
    }
    if (!mostRecent) return baseWeights;

    const halfLifeDays = getQueryNumber('halfLifeDays', 1825);
    return computeRecencyWeightedWeights(baseWeights, mostRecent, { alpha, halfLifeDays });
  }

  /**
   * Weighted random picker based on integer weights.
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

  /**
   * Board manager for a simple Jeopardy-style layout.
   */
  class JeopardyBoard {
    constructor(options) {
      this.container = options.container;
      this.maxColumns = options.maxColumns || 6;
      this.numRows = options.numRows || 5;
      this.pointValues = options.pointValues || [200, 400, 600, 800, 1000];
      this.questionsByCategory = options.questionsByCategory;
      this.activeCategories = [];
      this.renderSkeleton();
    }

    renderSkeleton() {
      this.container.innerHTML = '';
      const grid = document.createElement('div');
      grid.className = 'board-grid';
      grid.setAttribute('role', 'grid');
      grid.setAttribute('aria-label', 'Jeopardy board');
      this.grid = grid;
      this.container.appendChild(grid);
    }

    hasCategory(category) {
      return this.activeCategories.includes(category);
    }

    canAddMore() {
      return this.activeCategories.length < this.maxColumns;
    }

    addCategory(category) {
      if (!this.canAddMore()) return false;
      if (this.hasCategory(category)) return false;
      const questions = (this.questionsByCategory[category] || []).slice(0, this.numRows);
      const col = document.createElement('div');
      col.className = 'board-column';
      col.setAttribute('role', 'grid');

      const title = document.createElement('div');
      title.className = 'category-title';
      title.textContent = category;
      col.appendChild(title);

      for (let i = 0; i < this.numRows; i += 1) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cell';
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-expanded', 'false');
        const displayValue = this.pointValues[i] != null ? `$${this.pointValues[i]}` : '$?';
        cell.textContent = displayValue;

        const text = typeof questions[i] === 'string' ? questions[i] : null;
        
        if (text) {
          cell.addEventListener('click', () => {
            if (cell.classList.contains('revealed')) return;
            cell.classList.add('revealed');
            cell.setAttribute('aria-expanded', 'true');
            cell.innerHTML = `<span class="question-text">${text}</span>`;
          });
        } else {
          cell.disabled = true;
          cell.title = 'No question available';
        }
        col.appendChild(cell);
      }

      this.grid.appendChild(col);
      this.activeCategories.push(category);
      return true;
    }

    reset() {
      this.activeCategories = [];
      this.renderSkeleton();
    }
  }

  async function fetchQuestionBank() {
    const response = await fetch('./question_bank.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Failed to load question_bank.json: ${response.status}`);
    return response.json();
  }

  function chooseNextCategory(sampler, alreadyChosenSet, maxAttempts = 50) {
    for (let i = 0; i < maxAttempts; i += 1) {
      const pick = sampler.pick();
      if (pick && !alreadyChosenSet.has(pick)) return pick;
    }
    return null;
  }

  async function init() {
    const boardEl = document.getElementById('board');
    const addBtn = document.getElementById('addCategoryBtn');
    const resetBtn = document.getElementById('resetBtn');

    try {
      const embedded = getEmbeddedQuestionBank();
      const data = embedded || await fetchQuestionBank();
      boardEl.setAttribute('aria-busy', 'false');
      boardEl.innerHTML = '';

      const questionsByCategory = data.questionsByCategory || {};
      const baseWeights = data.weights || {};
      const weights = maybeApplyRecencyWeighting(baseWeights, data);
      const sampler = new WeightedSampler(weights);
      const realBoard = new JeopardyBoard({
        container: boardEl,
        maxColumns: 6,
        numRows: 5,
        pointValues: [200, 400, 600, 800, 1000],
        questionsByCategory
      });

      function updateButtons() {
        addBtn.disabled = !realBoard.canAddMore();
      }

      addBtn.addEventListener('click', () => {
        const chosenSet = new Set(realBoard.activeCategories);
        const next = chooseNextCategory(sampler, chosenSet);
        if (!next) {
          addBtn.disabled = true;
          return;
        }
        realBoard.addCategory(next);
        updateButtons();
      });

      resetBtn.addEventListener('click', () => {
        realBoard.reset();
        addBtn.disabled = false;
      });

      // Pre-fill first column to get started
      const first = chooseNextCategory(new WeightedSampler(weights), new Set());
      if (first) {
        realBoard.addCategory(first);
      }
      updateButtons();
    } catch (err) {
      boardEl.innerHTML = `<div class="board-empty">Failed to load question bank. ${String(err)}<br>Tip: If opening via file://, either paste JSON into the inline script tag in index.html or use a local server.</div>`;
      boardEl.setAttribute('aria-busy', 'false');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());

