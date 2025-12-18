import { useEffect, useMemo, useState } from "react";
import "./JeopardyBoard.css";


const STRATEGY_QUESTION_BANK = {
  "Which rows may the Daily Double appear in?":"Rows 2 to 5 (all but the top row, and most often in 4 or 5).",
  "What accuracy rate do you need for it to be profitable to go 'all in' on a Daily Double?": "50%. The average accuracy rate for the Daily Double is 65%. So, unless you have a large edge and a big lead, go crazy!",
  "What are the classically feared categories (that you may be able to exploit with extra training)?": "Opera, Shakespeare, Classical Music, Word Play...",
  "Top players consistently buzz slightly more or less quickly than the average player?": "Slower. Buzzing in while the hosts are still speaking is a common mistake to avoid.",
  "Which are valid reasons to jump between categories? 1. Disrupt opponents’ rhythm 2. Hide Daily Doubles 3. Force others to context-switch 4. All of the above": "4. (All of the above)",
  "At final Jeopardy, your opponent has $475 and you have $875. You feel like playing it safe. What’s the minimum amount you can bet to secure a victory should you both answer correctly?":"$76 (Your opponent may only bet up to his current winnings, putting him at $950 if he succeeds and requiring you to win $951 to have him covered).",
  "In Double Jeopardy, some common Daily Double spots are:": "Unusual categories, and the bottom row of a middle column.",
  "How confident should you be to answer as opposed to staying silent in a standard round?": "80% is a good rule of thumb, since being wrong gives points to your opponent.",
  "To buzz in on time for the Final Question, you should:":"Listen to the cadence of the host's voice and watch your opponent's posture.",
  "You're not in love with certain category, but you narrowly choose it anyways early on in a board. Why?":"It sometimes is reasonable to avoid tipping your hand too early about your strongest categories so that you opponent doesn't chase them to deny you equity.",
  "Besides the high pay-off, another reason to go for the bottom-row questions might be to:": "Deny the value to your opponents, particularly if they've engaged with the category already, or to deny your opponent a chance at winning if you have a lead approaching Final Jeopardy.",
}


export default function StrategyMode({ onBackToMenu }) {
  const orderedKeys = useMemo(() => Object.keys(STRATEGY_QUESTION_BANK).sort(), []);
  const [idx, setIdx] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (!orderedKeys.length) return;
    const q = orderedKeys[idx % orderedKeys.length];
    setPrompt(q);
    setAnswer(STRATEGY_QUESTION_BANK[q]);
    setShowAnswer(false);
  }, [idx, orderedKeys]);

  function nextTip() {
    setIdx((i) => (i + 1) % (orderedKeys.length || 1));
  }

  return (
    <div className="board-container">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <button className="back-to-menu-btn" onClick={onBackToMenu}>
          ← Back to Menu
        </button>
      </div>

      <div className="board" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="category" style={{ marginBottom: "1rem" }}>
          Strategy
        </div>
        <div className="clue showingQuestion" style={{ maxWidth: 600, width: "100%" }}>
          <div className="clue-content">
            {!showAnswer ? (
              <>
                <div>{prompt}</div>
                <button className="show-answer-btn" onClick={() => setShowAnswer(true)} style={{ marginTop: "1rem" }}>
                  Show Answer
                </button>
              </>
            ) : (
              <div>{answer}</div>
            )}
          </div>
        </div>
        <button
          className="show-answer-btn"
          onClick={nextTip}
          style={{ marginTop: "1rem", padding: "0.75rem 1.5rem", fontSize: "1.1rem" }}
        >
          New Tip
        </button>
      </div>
    </div>
  );
}


