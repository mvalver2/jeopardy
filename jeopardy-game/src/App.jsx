import { useState } from "react";
import JeopardyMode from "./JeopardyMode";
import FinalMode from "./FinalMode";
import StrategyMode from "./StrategyMode";
import SingleJeopardyData from "./single_jeopardy.json";
import DoubleJeopardyData from "./double_jeopardy.json";
import FinalJeopardyData from "./final_jeopardy.json";

export default function App() {
  const [mode, setMode] = useState(null);

  if (!mode) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>🎯 Jeopardy Trainer</h1>

        {/* Mode buttons at the top */}
        <div style={styles.buttonContainer}>
          <button style={styles.button} onClick={() => setMode("single")}>
            Single Jeopardy
          </button>
          <button style={styles.button} onClick={() => setMode("double")}>
            Double Jeopardy
          </button>
          <button style={styles.button} onClick={() => setMode("final")}>
            Final Jeopardy
          </button>
          <button style={styles.button} onClick={() => setMode("strategy")}>
            Strategy
          </button>
        </div>

        {/* Instructions below */}
        <div style={styles.instructionsContainer}>
          <h2 style={styles.instructionsTitle}>How to Use This Trainer</h2>
          <p style={styles.instructionsText}>
            Practice your Jeopardy skills in the recommended order to improve your performance:
          </p>

          <div style={styles.stepsContainer}>
            <div style={styles.stepCard}>
              <div style={styles.stepIcon}>1️⃣</div>
              <div>
                <h3>Single Jeopardy</h3>
                <p>Start here to practice standard clues and get comfortable with the format.</p>
              </div>
            </div>

            <div style={styles.stepCard}>
              <div style={styles.stepIcon}>2️⃣</div>
              <div>
                <h3>Double Jeopardy</h3>
                <p>Tackle higher-value clues and more challenging questions.</p>
              </div>
            </div>

            <div style={styles.stepCard}>
              <div style={styles.stepIcon}>3️⃣</div>
              <div>
                <h3>Final Jeopardy</h3>
                <p>Test your knowledge with the ultimate question</p>
              </div>
            </div>

            <div style={styles.stepCard}>
              <div style={styles.stepIcon}>💡</div>
              <div>
                <h3>Strategy</h3>
                <p>Learn tips and tricks for buzzer strategy, clue selection, and improving your game.</p>
              </div>
            </div>
          </div>

          <p style={{ marginTop: "1rem", textAlign: "center" }}>
            This trainer is designed to prepare you for real Jeopardy games. Have fun and good luck!
          </p>
        </div>
      </div>
    );
  }

  switch (mode) {
    case "single":
      return <JeopardyMode data={SingleJeopardyData} onBackToMenu={() => setMode(null)} />;
    case "double":
      return <JeopardyMode data={DoubleJeopardyData} onBackToMenu={() => setMode(null)} />;
    case "final":
      return <FinalMode data={FinalJeopardyData} onBackToMenu={() => setMode(null)} />;
    case "strategy":
      return <StrategyMode onBackToMenu={() => setMode(null)} />;
    default:
      return null;
  }
}

// Styles
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#000b5c",
    color: "#ffcc33",
    padding: "2rem",
    minHeight: "100vh",
    boxSizing: "border-box",
  },
  title: {
    fontSize: "3rem",
    marginBottom: "2rem",
    textAlign: "center",
    textShadow: "2px 2px #061a8f",
  },
  buttonContainer: {
    display: "flex",
    gap: "2rem",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: "2rem",
  },
  button: {
    backgroundColor: "#ffcc33",
    color: "#061a8f",
    fontWeight: "bold",
    fontSize: "1.5rem", // larger text
    padding: "1.5rem 3rem", // bigger buttons
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow: "2px 2px 8px #000",
    transition: "all 0.2s ease",
  },
  instructionsContainer: {
    backgroundColor: "#061a8f",
    borderRadius: "12px",
    padding: "2rem",
    maxWidth: "800px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
  instructionsTitle: {
    fontSize: "1.8rem",
    marginBottom: "1rem",
    textAlign: "center",
    textDecoration: "underline",
  },
  instructionsText: {
    fontSize: "1.2rem",
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  stepsContainer: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "1rem",
  },
  stepCard: {
    display: "flex",
    alignItems: "flex-start",
    backgroundColor: "#0b1fd3",
    borderRadius: "8px",
    padding: "1rem",
    gap: "1rem",
  },
  stepIcon: {
    fontSize: "2rem",
    flexShrink: 0,
  },
};

// Hover effect
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  button:hover {
    background-color: #ffd633;
    transform: scale(1.05);
  }
`, styleSheet.cssRules.length);
