import { useEffect, useRef, useState } from "react";
import { getFinalQuestion } from "./utils";
import "./JeopardyBoard.css";

const QUESTION_TIME = 30;
const WARNING_TIME = 15;

export default function FinalMode({ data, onBackToMenu }) {
  const [question, setQuestion] = useState(null);
  const [state, setState] = useState("showingQuestion");
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);

  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [showLoseOverlay, setShowLoseOverlay] = useState(false);

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  /* Load question */
  useEffect(() => {
    rollQuestion();
  }, [data]);

  /* ⏱ TIMER */
  useEffect(() => {
    if (state !== "showingQuestion" && state !== "showingAnswer") return;

    if (timeLeft <= 0) {
      setState("answeredIncorrect");
      setShowLoseOverlay(true);
      handleStop();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [state, timeLeft]);

  const rollQuestion = () => {
    const q = getFinalQuestion(data);
    setQuestion(q);
    setState("showingQuestion");
    setTimeLeft(QUESTION_TIME);
    setShowWinOverlay(false);
    setShowLoseOverlay(false);
    handleStop();
  };

  /* 🔊 Music controls */
  const handlePlay = async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (_) {}
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  const showAnswer = () => {
    setState("showingAnswer");
    handleStop();
  };

  const markCorrect = () => {
    setState("answeredCorrect");
    setShowWinOverlay(true);
    handleStop();
  };

  const markIncorrect = () => {
    setState("answeredIncorrect");
    setShowLoseOverlay(true);
    handleStop();
  };

  if (!question) {
    return (
      <div className="board-container">
        <button className="back-to-menu-btn" onClick={onBackToMenu}>
          ← Back to Menu
        </button>
        <div style={{ color: "#ffcc33", textAlign: "center", marginTop: "2rem" }}>
          Loading final question…
        </div>
      </div>
    );
  }

  const timerStyle = {
    color: timeLeft <= WARNING_TIME ? "#dc3545" : "#28a745",
    fontWeight: "bold",
    marginTop: "0.5rem",
  };

  return (
    <div className="board-container">
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <button className="back-to-menu-btn" onClick={onBackToMenu}>
          ← Back to Menu
        </button>
        <button onClick={handlePlay} disabled={isPlaying}>
          Play Music
        </button>
        <button onClick={handleStop} disabled={!isPlaying}>
          Stop Music
        </button>
      </div>

      <audio ref={audioRef} src="/Jeopardy_theme.mp3" preload="auto" />

      <div
        className="board"
        style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <div className="category" style={{ marginBottom: "1rem" }}>
          {question.category || "Final Jeopardy"}
        </div>

        <div className="clue showingQuestion" style={{ maxWidth: 900 }}>
          <div className="clue-content">
            {state === "showingQuestion" && (
              <>
                <div>{question.question}</div>
                <div className="timer" style={timerStyle}>
                  ⏱ {timeLeft}s
                </div>
                <button className="show-answer-btn" onClick={showAnswer}>
                  Show Answer
                </button>
              </>
            )}

            {state === "showingAnswer" && (
              <>
                <div>{question.answer}</div>
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
            )}

            {state === "answeredIncorrect" && (
              <div>{question.answer}</div>
            )}
          </div>
        </div>
      </div>

      {/* WIN OVERLAY */}
      {showWinOverlay && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>🎉 You Win Final Jeopardy!</h2>
            <button onClick={onBackToMenu}>Back to Menu</button>
          </div>
        </div>
      )}

      {/*LOSE OVERLAY */}
      {showLoseOverlay && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>❌ Incorrect</h2>
            <p>The correct answer was:</p>
            <strong>{question.answer}</strong>
            <button onClick={onBackToMenu}>Back to Menu</button>
          </div>
        </div>
      )}
    </div>
  );
}
