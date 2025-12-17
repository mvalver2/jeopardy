// ClueCell.jsx
import { useState } from "react";

export default function ClueCell({ clue, value }) {
  const [revealed, setRevealed] = useState(false);

  if (!clue) return <div className="cell empty"></div>;

  return (
    <div
      className={`cell ${revealed ? "revealed" : ""}`}
      onClick={() => setRevealed(true)}
    >
      {revealed ? (
        <div dangerouslySetInnerHTML={{ __html: clue.question }} />
      ) : (
        `$${value}`
      )}
    </div>
  );
}
