import React, { useState, useEffect } from "react";
import "./JeopardyBoard.css";

const QUESTION_TIME = 30;
const WARNING_TIME = 15;

export default function Clue({ clue, score, setScore, disabled }) {
  const [state, setState] = useState("hidden");
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);

  if (!clue) return <div className="clue disabled">?</div>;

  /* ⏱ TIMER LOGIC */
  useEffect(() => {
    if (state !== "showingQuestion" && state !== "showingAnswer") return;

    if (timeLeft <= 0) {
      markIncorrect();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [state, timeLeft]);

  const handleClick = () => {
    if (state === "hidden") {
      setTimeLeft(QUESTION_TIME);
      setState("showingQuestion");
    }
  };

  const showAnswer = (e) => {
    e.stopPropagation();
    setState("showingAnswer");
  };

  const markCorrect = (e) => {
    if (e) e.stopPropagation();
    setScore((prev) => prev + (clue.value || 0));
    setState("answeredCorrect");
  };

  const markIncorrect = (e) => {
    if (e) e.stopPropagation();
    setScore((prev) => prev - (clue.value || 0));
    setState("answeredIncorrect");
  };

  /* TIMER COLOR */
  const timerStyle = {
    color: timeLeft <= WARNING_TIME ? "#dc3545" : "#008000",
    fontWeight: "bold",
    marginTop: "0.5rem",
  };

  let content;

  if (state === "hidden") {
    content = `$${clue.value}`;
  } 
  else if (state === "showingQuestion") {
    content = (
      <>
        <div>{clue.question}</div>
        <div className="timer" style={timerStyle}>
          ⏱ {timeLeft}s
        </div>
        <button className="show-answer-btn" onClick={showAnswer}>
          Show Answer
        </button>
      </>
    );
  } 
  else if (state === "showingAnswer") {
    content = (
      <>
        <div>{clue.answer}</div>
        <div className="timer" style={timerStyle}>
          ⏱ {timeLeft}s
        </div>
        <button className="correct-btn" onClick={markCorrect}>
          Correct
        </button>
        <button className="incorrect-btn" onClick={markIncorrect}>
          Incorrect
        </button>
      </>
    );
  } 
  else {
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
