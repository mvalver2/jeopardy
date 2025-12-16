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
            cell.textContent = text;
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
      const weights = data.weights || {};
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

