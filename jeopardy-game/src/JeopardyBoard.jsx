import React from "react";
import Clue from "./Clue";
import "./JeopardyBoard.css";

export default function JeopardyBoard({ boardData, score, setScore, onBackToMenu }) {
  const allAnswered = boardData.every((column) =>
    column.clues.every((clue) => clue.answeredCorrect || clue.answeredIncorrect)
  );

  return (
    <div className="board-container">
      {/* Back to Menu button on top-left */}
      <button className="back-to-menu-btn" onClick={onBackToMenu}>
        ← Back to Menu
      </button>

      <div className="board">
        {boardData.map((column, colIndex) => (
          <div key={colIndex} className="column">
            <div className="category">{column.category}</div>
            {column.clues.map((clue, clueIndex) => (
              <Clue
                key={clueIndex}
                clue={clue}
                score={score}
                setScore={setScore}
              />
            ))}
          </div>
        ))}
      </div>

      {allAnswered && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>🎉 You finished this board!</h2>
            <button onClick={onBackToMenu}>Back to Menu</button>
          </div>
        </div>
      )}
    </div>
  );
}
