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

  shuffleArray(eligibleCategories);

  const selectedCategories = eligibleCategories.slice(0, numCategories);

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
