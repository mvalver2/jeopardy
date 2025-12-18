import { useState } from "react";
import JeopardyMode from "./JeopardyMode";
import FinalMode from "./FinalMode";
import StrategyMode from "./StrategyMode";
import SingleJeopardyData from "./single_jeopardy.json";
import DoubleJeopardyData from "./double_jeopardy.json";
import FinalJeopardyData from "./final_jeopardy.json";
//import strategyData from "./strategy.json"; 

export default function App() {
  const [mode, setMode] = useState(null);

  if (!mode) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Choose a Game Mode</h1>
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

// styles unchanged...

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#000b5c",
    color: "#ffcc33",
  },
  title: {
    fontSize: "3rem",
    marginBottom: "3rem",
    textAlign: "center",
    textShadow: "2px 2px #061a8f",
  },
  buttonContainer: {
    display: "flex",
    gap: "2rem",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  button: {
    backgroundColor: "#ffcc33",
    color: "#061a8f",
    fontWeight: "bold",
    fontSize: "1.2rem",
    padding: "1rem 2rem",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    boxShadow: "2px 2px 5px #000",
    transition: "all 0.2s ease",
  },
};

// Hover effect (can be in App.css instead if you prefer)
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  button:hover {
    background-color: #ffd633;
    transform: scale(1.05);
  }
`, styleSheet.cssRules.length);
