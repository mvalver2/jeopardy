import React, { useState } from "react";
import "./JeopardyBoard.css"; 

export default function Clue({ clue, score, setScore }) {
  const [state, setState] = useState("hidden"); // hidden, showingQuestion, showingAnswer, answered

  if (!clue) return <div className="clue disabled">?</div>;

  const handleClick = () => {
    if (state === "hidden") setState("showingQuestion");
  };

  const showAnswer = (e) => {
    e.stopPropagation();
    setState("showingAnswer");
  };

  const markCorrect = (e) => {
    e.stopPropagation();
    setScore(prev => prev + (clue.value || 0));
    setState("answeredCorrect");
  };

  const markIncorrect = (e) => {
    e.stopPropagation();
    setScore(prev => prev - (clue.value || 0));
    setState("answeredIncorrect");
  };

  let content;
  if (state === "hidden") {
    content = `$${clue.value}`;
  } else if (state === "showingQuestion") {
    content = (
      <>
        <div>{clue.question}</div>
        <button className="show-answer-btn" onClick={showAnswer}>Show Answer</button>
      </>
    );
  } else if (state === "showingAnswer") {
    content = (
      <>
        <div>{clue.answer}</div>
        <button className="correct-btn" onClick={markCorrect}>Correct</button>
        <button className="incorrect-btn" onClick={markIncorrect}>Incorrect</button>
      </>
    );
  } else {
    // answered (either correct or incorrect)
    content = <div>{clue.answer}</div>;
  }

  return (
    <div
      className={`clue ${state}`}
      onClick={handleClick}
    >
      <div className="clue-content">{content}</div>
    </div>
  );
}
