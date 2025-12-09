import { useMemo, useState } from "react";

const CLAIMS = [
  { id: 1, claim: "Leaving a laptop plugged in constantly will significantly damage the battery.", correctAnswer: "false" },
  { id: 2, claim: "Your stomach replaces its lining every two to three days.", correctAnswer: "false" },
  { id: 3, claim: "Africa is larger than the United States, China, and India combined.", correctAnswer: "true" },
  { id: 4, claim: "The Amazon rainforest produces 20% of the world's oxygen.", correctAnswer: "false" },
  { id: 5, claim: "The population of Iceland is more than 300,000 people.", correctAnswer: "true" },
  { id: 6, claim: "There are hundreds of harmful chemicals in tires.", correctAnswer: "true" },
  { id: 7, claim: "The Moon's gravity affects your weight on Earth when it is closer or farther away.", correctAnswer: "false" },
  { id: 8, claim: "A basketball will hit the ground before a tennis ball when dropped at the same height.", correctAnswer: "false" },
  { id: 9, claim: "A raincloud weighs more than an 18-wheeler truck.", correctAnswer: "true" },
  { id: 10, claim: "Human bodies contain equal numbers of bacterial and human cells.", correctAnswer: "false" },
  { id: 11, claim: "Most humans can distinguish about 2 million different colors.", correctAnswer: "false" },
  { id: 12, claim: "Almost all the dust in your home comes from dead human skin.", correctAnswer: "false" },
  { id: 13, claim: "Humans emit less carbon dioxide walking one mile than a car traveling the same distance.", correctAnswer: "true" },
  { id: 14, claim: "The average person speaks over 16,000 words per day.", correctAnswer: "false" },
  { id: 15, claim: "Most plastic in the ocean comes from rivers.", correctAnswer: "true" },
  { id: 16, claim: "The average adult spends more money on groceries than on subscriptions.", correctAnswer: "true" },
  { id: 17, claim: "The average person's skin regenerates roughly every 28 days.", correctAnswer: "false" },
  { id: 18, claim: "Around 20% of people who are left-handed are also left-footed.", correctAnswer: "false" },
  { id: 19, claim: "The Great Wall of China is visible from space with the naked eye.", correctAnswer: "false" },
  { id: 20, claim: "The average person spends about equal time in REM sleep as in deep sleep.", correctAnswer: "true" },
];

// ---------------------------
// Button Style Helper
// ---------------------------
function buttonStyle({
  active,
  theme,
  hovered,
  disabled,
}: {
  active: boolean;
  theme: "light" | "dark";
  hovered?: boolean;
  disabled?: boolean;
}) {
  const isDark = theme === "dark";

  let bg = active
    ? isDark ? "#747087" : "#d3d1e0"
    : isDark ? "#46415c" : "#f1f1f5";

  let border = active
    ? isDark ? "#9c97b3" : "#b5b2c8"
    : isDark ? "#5c5675" : "#dcdce5";

  let text = isDark ? "white" : "#222";

  if (hovered && !disabled) {
    bg = isDark ? "#6a6580" : "#e3e1f0";
    border = isDark ? "#8d88a6" : "#c5c2d8";
  }

  if (disabled) {
    bg = isDark ? "#3a364a" : "#e2e2e2";
    border = "transparent";
    text = isDark ? "#888" : "#999";
  }

  return {
    padding: "8px 14px",
    marginRight: 10,
    borderRadius: 6,
    border: `1px solid ${border}`,
    background: bg,
    color: text,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background 0.2s ease",
  };
}

// ---------------------------
// Reusable Button Component
// ---------------------------
function ThemedButton({
  children,
  active,
  disabled,
  theme,
  onClick,
  style = {},
  className = "",
}: {
  children: any;
  active: boolean;
  disabled?: boolean;
  theme: "light" | "dark";
  onClick?: () => void;
  style?: any;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...buttonStyle({ active, theme, hovered, disabled }),
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------
// Supabase Types
// ---------------------------
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

interface TrialResult {
  trial: number;
  claim: string;
  answer: boolean;
  confidence: number;
  aiOffered: boolean;
  aiUsed: boolean;
  isCorrect: boolean;
  timeBeforeAI: number | null;
  timeAfterAI: number | null;
  timeTotal: number | null;
  score: number;
}

function shuffleArray(arr: any[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ---------------------------
// MAIN APP
// ---------------------------
export default function App() {
  const shuffledClaims = useMemo(() => shuffleArray(CLAIMS), []);
  const [, setResults] = useState<TrialResult[]>([]);
  const participantID = useMemo(() => crypto.randomUUID(), []);
  const [showIntro, setShowIntro] = useState(true);
  const [trialIndex, setTrialIndex] = useState(0);

  const [initialAnswer, setInitialAnswer] = useState<boolean | null>(null);
  const [initialConfidence, setInitialConfidence] = useState<number | null>(null);

  const [aiRevealed, setAiRevealed] = useState(false);
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const [score, setScore] = useState(0);
  const [tQuestionStart, setTQuestionStart] = useState(Date.now());
  const [tReveal, setTReveal] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NEW FEEDBACK STATES
  const [flashType, setFlashType] = useState<"correct" | "incorrect" | null>(null);

  const trial = shuffledClaims[trialIndex];

  // Flash class
  const flashClass =
    flashType === "correct"
      ? "flash-green"
      : flashType === "incorrect"
      ? "flash-red"
      : "";

  // Inject keyframes
  const globalStyles = `
    @keyframes bgFlashRed {
      0% { background-color: #ff4f4f; }
      100% { background-color: inherit; }
    }
    @keyframes bgFlashGreen {
      0% { background-color: #3bd673; }
      100% { background-color: inherit; }
    }

    .flash-red {
      animation: bgFlashRed 0.6s ease;
    }
    .flash-green {
      animation: bgFlashGreen 0.6s ease;
    }
  `;
  
  const Leaderboard = ({ theme }: { theme: "light" | "dark" }) => {
    const isDark = theme === "dark";

    return (
      <div
        style={{
          marginTop: 30,
          padding: 20,
          background: isDark ? "#2a2535" : "#f4f4f4",
          borderRadius: 8,
          border: `2px solid ${isDark ? "#3d3750" : "#ddd"}`,
          color: isDark ? "white" : "#222",
        }}
      >
        <h3 style={{ margin: 0, marginBottom: 15 }}>🏆 Current Leaderboard</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 18, fontWeight: "bold" }}>1. 1700 points</div>
          <div style={{ fontSize: 18, fontWeight: "bold" }}>2. 1500 points</div>
          <div style={{ fontSize: 18, fontWeight: "bold" }}>3. 1400 points</div>
        </div>
      </div>
    );
  };


  const NavBar = ({ theme, score, setTheme }: {
  theme: "light" | "dark";
  score: number;
  setTheme: (t: "light" | "dark") => void;
}) => {
  const isDark = theme === "dark";

  return (
    <div
      style={{
        width: "95%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingRight: 40,
        marginBottom: 30,
      }}
    >
      {/* Left — MINI LEADERBOARD */}
      <div style={{ textAlign: "center", marginRight: 30 }}>
        <div style={{ fontSize: 18, fontWeight: "bolder" }}>🏆 Current Leaderboard (Top 3)</div>
        <div style={{ fontSize: 14, opacity: 0.8, fontWeight: "bold" }}>
          1st: 1700 • 2nd: 1500 • 3rd: 1400
        </div>
      </div>

      {/* CENTER — SCORE */}
      <div style={{ fontSize: 26, fontWeight: "bold" }}>
        Score: {score}
      </div>

      { /* RIGHT – THEME TOGGLE */ }
      <ThemedButton
        active={false}
        theme={theme}
        onClick={() => setTheme(isDark ? "light" : "dark")}
      >
        Toggle {isDark ? "Light" : "Dark"}
      </ThemedButton>
    </div>
  );
};


  async function getAIAnswer(claim: string) {
    try {
      const response = await fetch('/api/get-ai-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim })
      });

      if (!response.ok) throw new Error("API error");

      const raw = await response.text();
      if (!raw) throw new Error("Empty AI response");

      const data = JSON.parse(raw);
      return data.answer || "Error processing response.";
    } catch {
      return "Error: Could not load AI answer.";
    }
  }

  async function revealAI() {
    if (!aiRevealed) {
      setTReveal(Date.now());
      setAiRevealed(true);
      setAiLoading(true);

      const answer = await getAIAnswer(trial.claim);
      setAiAnswer(answer);
      setAiLoading(false);
    }
  }

  async function sendResultsToSupabase(finalResults: TrialResult[]) {
    console.log("Sending to Supabase:", finalResults);

    try {
      const dataToSend = finalResults.map(r => ({
        participant_id: participantID,
        trial: r.trial,
        claim: r.claim,
        answer: r.answer,
        confidence: r.confidence,
        ai_offered: r.aiOffered,
        ai_used: r.aiUsed,
        is_correct: r.isCorrect,
        time_before_ai: r.timeBeforeAI,
        time_after_ai: r.timeAfterAI,
        time_total: r.timeTotal,
        score: r.score,
      }));

      const response = await fetch(`${SUPABASE_URL}/rest/v1/experiment_results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        alert("❌ Failed to submit results");
        return;
      }

      alert("✅ Results submitted!");
    } catch {
      alert("❌ Error submitting results");
    }
  }

  function submitTrial() {
    if (initialAnswer === null || initialConfidence === null) {
      alert("Please answer + give confidence.");
      return;
    }

    const submissionTime = Date.now();
    const timeTotal = submissionTime - tQuestionStart;
    const timeBeforeAI = tReveal ? tReveal - tQuestionStart : null;
    const timeAfterAI = tReveal ? submissionTime - tReveal : null;

    const isCorrect = initialAnswer === (trial.correctAnswer === "true");

    // Start flashing
    setFlashType(isCorrect ? "correct" : "incorrect");

    setTimeout(() => setFlashType(null), 600);

    // Delay so user sees flash
    setTimeout(() => {
      if (isCorrect) setScore(s => s + 100);

      const trialResult: TrialResult = {
        trial: trial.id,
        claim: trial.claim,
        answer: initialAnswer,
        confidence: initialConfidence,
        aiOffered: trialIndex < 10,
        aiUsed: aiRevealed,
        isCorrect,
        timeBeforeAI,
        timeAfterAI,
        timeTotal,
        score: isCorrect ? 100 : 0,
      };

      const last = trialIndex + 1 >= shuffledClaims.length;

      setResults(prev => {
        const updated = [...prev, trialResult];
        if (last) sendResultsToSupabase(updated);
        return updated;
      });

      if (last) {
        setIsSubmitting(true);
        return;
      }

      // Reset for next question
      setInitialAnswer(null);
      setInitialConfidence(null);
      setAiRevealed(false);
      setAiAnswer("");
      setTReveal(null);
      setTQuestionStart(Date.now());
      setTrialIndex(i => i + 1);

    }, 1000);
  }

  // Intro screen
  if (showIntro) {
    const isDark = theme === "dark";

    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 40,
          textAlign: "center",
          background: isDark ? "#1b1924" : "#fafafa",
          color: isDark ? "white" : "#222",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ maxWidth: 700 }}>
          <h1 style={{ color: isDark ? "white" : "#222" }}>
            Welcome to the Experiment
          </h1>

          <p style={{ marginTop: 20, fontSize: 18, color: isDark ? "#ddd" : "#333" }}>
            You will see several True/False claims. Rate your confidence for each answer
            from 1 (not confident) to 7 (very confident). Confidence rating doesn't
            affect your score, so please be honest!
            <br /><br />
            Your goal is simply <strong>to answer as many questions correct as possible.
            You get 100 points per correct answer (2000 possible).</strong>
            <br /><br />
            You will likely not know the answer to most of these questions immediately.
            You will have the option to consult an AI during the questions. You are being
            tested on your <strong>knowledge</strong> and your <strong>ability to utilize AI effectively
            to reason an answer to a difficult question.</strong>
          </p>

          <Leaderboard theme={theme} />

          <button
            onClick={() => setShowIntro(false)}
            style={{
              marginTop: 30,
              padding: "12px 30px",
              fontSize: 18,
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: isDark ? "#46415c" : "#e3e1f0",
              color: isDark ? "white" : "#222",
              transition: "0.2s",
            }}
          >
            Start
          </button>
        </div>
      </div>
    );
  }


  const bg = theme === "dark" ? "#1b1924" : "#fafafa";
  const text = theme === "dark" ? "white" : "#222";

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        paddingLeft: 20,
        paddingTop: 5,
        background: bg,
        color: text,
        fontFamily: "sans-serif",
        position: "relative"
      }}
    >
      <style>{globalStyles}</style>
      
      <NavBar theme={theme} score={score} setTheme={setTheme}/>

      {/* CLAIM */}
      <h3 style={{ marginTop: 40 }}>Claim:</h3>
      <p style={{ fontSize: 20 }}>{trial.claim}</p>

      <div style={{ display: "flex", gap: 30, marginTop: 20, flexWrap: "wrap" }}>

        {/* LEFT SIDE */}
        <div style={{ flex: 1, minWidth: 320 }}>

          {/* True/False */}
          <p><strong>Your Answer:</strong></p>
          <div>
            <ThemedButton
              className={flashClass}
              active={initialAnswer === true}
              theme={theme}
              onClick={() => setInitialAnswer(true)}
            >
              True
            </ThemedButton>

            <ThemedButton
              className={flashClass}
              active={initialAnswer === false}
              theme={theme}
              onClick={() => setInitialAnswer(false)}
            >
              False
            </ThemedButton>
          </div>

          {/* Confidence */}
          <p style={{ marginTop: 20 }}><strong>Your Confidence:</strong></p>
          <div>
            <p></p>
            <div style={{ position: 'relative' }}>
              <div>
                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                  <ThemedButton
                    key={num}
                    className={flashClass}
                    active={initialConfidence === num}
                    theme={theme}
                    onClick={() => setInitialConfidence(num)}
                  >
                    {num}
                  </ThemedButton>
                ))}
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: '8px',
                fontSize: '14px',
                width: '55%',
                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
              }}>
                <span>Unsure</span>
                <span>Absolutely certain</span>
              </div>
            </div>
          </div>

          {/* Submit + AI */}
          <div style={{ display: "flex", gap: 15, alignItems: "center", marginTop: 25 }}>
            <ThemedButton
              className={flashClass}
              active={false}
              theme={theme}
              disabled={isSubmitting || initialAnswer === null || initialConfidence === null}
              onClick={submitTrial}
              style={{ maxWidth: 150 }}
            >
              {isSubmitting ? "Submitting..." : "Submit Answer"}
            </ThemedButton>

            {trialIndex < 10 && !aiRevealed && (
              <ThemedButton
                active={false}
                theme={theme}
                onClick={revealAI}
                style={{ padding: "8px 12px" }}
              >
                Consult AI
              </ThemedButton>
            )}
          </div>
        </div>

        {/* RIGHT SIDE PANEL — LEADERBOARD + (optional AI answer) */}
        <div
          style={{
            flex: 1,
            minWidth: 320,
            borderLeft: "1px solid #666",
            paddingLeft: 20,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >

          {/* AI Answer only shows during first 10 trials when revealed */}
          {trialIndex < 10 && aiRevealed && (
            <div
              style={{
                padding: 15,
                marginRight: 30,
                border: "1px solid #ccc",
                borderRadius: 8,
                background: theme === "dark" ? "#2a2535" : "#fff",
                minHeight: 60,
                whiteSpace: "pre-wrap",
                color: theme === "dark" ? "white" : "#222",
              }}
            >
              {aiLoading ? "Loading AI response..." : aiAnswer}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
