import { useEffect, useRef, useState } from "react";
import { getFinalQuestion } from "./utils";
import "./JeopardyBoard.css";

export default function FinalMode({ data, onBackToMenu }) {
  const [question, setQuestion] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    rollQuestion();
  }, [data]);

  const rollQuestion = () => {
    const q = getFinalQuestion(data);
    setQuestion(q);
    setShowAnswer(false);
  };

  const handlePlay = async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (_) {
    }
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  const revealAnswer = () => {
    setShowAnswer(true);
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

  return (
    <div className="board-container">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <button className="back-to-menu-btn" onClick={onBackToMenu}>
          ← Back to Menu
        </button>
        <button onClick={rollQuestion}>New Final Question</button>
        <button onClick={isPlaying ? undefined : handlePlay} disabled={isPlaying}>Play Music</button>
        <button onClick={handleStop} disabled={!isPlaying}>Stop Music</button>
      </div>

      {}
      <audio ref={audioRef} src="/Jeopardy_theme.mp3" preload="auto" />

      <div className="board" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="category" style={{ marginBottom: "1rem" }}>
          {question.category || "Final Jeopardy"}
        </div>
        <div className="clue showingQuestion" style={{ maxWidth: 900 }}>
          <div className="clue-content">
            {!showAnswer ? (
              <>
                <div>{question.question}</div>
                <button className="show-answer-btn" onClick={revealAnswer} style={{ marginTop: "1rem" }}>
                  Show Answer
                </button>
              </>
            ) : (
              <div>{question.answer}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


