import { useState, useEffect } from "react";
import JeopardyBoard from "./JeopardyBoard";
import { getRandomBoard } from "./utils";

export default function JeopardyMode({ data, onBackToMenu }) {
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const randomBoard = getRandomBoard(data, [200,400,600,800,1000], 5);
    setBoard(randomBoard);
  }, [data]);

  if (!board.length) return <div style={{ color: "#ffcc33" }}>Loading...</div>;

  return (
    <div>
      <h1 style={{ color: "#ffcc33", textAlign: "center" }}>Score: {score}</h1>
      <JeopardyBoard
        boardData={board}
        score={score}
        setScore={setScore}
        onBackToMenu={onBackToMenu} // <-- forward it here
      />
    </div>
  );
}

