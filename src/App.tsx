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

// Button Style Helper
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

  // Base
  let bg = active
    ? isDark ? "#747087" : "#d3d1e0"
    : isDark ? "#46415c" : "#f1f1f5";

  let border = active
    ? isDark ? "#9c97b3" : "#b5b2c8"
    : isDark ? "#5c5675" : "#dcdce5";

  let text = isDark ? "white" : "#222";

  // Hover
  if (hovered && !disabled) {
    bg = isDark ? "#6a6580" : "#e3e1f0";
    border = isDark ? "#8d88a6" : "#c5c2d8";
  }

  // Disabled
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
    opacity: disabled ? 0.6 : 1,
    transition: "background 0.15s ease, border 0.15s ease, opacity 0.15s ease",
  };
}


// ---------------------------
// Reusable ThemedButton Component
// ---------------------------
function ThemedButton({
  children,
  active,
  disabled,
  theme,
  onClick,
  style = {},
}: {
  children: any;
  active: boolean;
  disabled?: boolean;
  theme: "light" | "dark";
  onClick?: () => void;
  style?: any;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
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
// Supabase Types & Utils
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
// Main Component
// ---------------------------
export default function App() {
  const shuffledClaims = useMemo(() => shuffleArray(CLAIMS), []);

  const [,setResults] = useState<TrialResult[]>([]);
  const participantID = useMemo(() => crypto.randomUUID(), []);
  const [showIntro, setShowIntro] = useState(true);
  const [trialIndex, setTrialIndex] = useState(0);

  const [initialAnswer, setInitialAnswer] = useState<boolean | null>(null);
  const [initialConfidence, setInitialConfidence] = useState<number | null>(null);

  const [aiRevealed, setAiRevealed] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const [score, setScore] = useState(0);
  const [tQuestionStart, setTQuestionStart] = useState(Date.now());
  const [tReveal, setTReveal] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trial = shuffledClaims[trialIndex];

  const bg = theme === "dark" ? "#1b1924" : "#fafafa";
  const text = theme === "dark" ? "white" : "#222";


  async function getAIAnswer(claim: string) {
    try {
      const response = await fetch('/api/get-ai-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim })
      });

      // Check if response is ok before parsing
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      // Check if response has content
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from API');
      }

      const data = JSON.parse(text);
      return data.answer || 'Error: No answer received';
      
    } catch (error) {
      console.error('Error getting AI answer:', error);
      return 'Error: Unable to get AI response. Please try again.';
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
        const errorText = await response.text();
        console.error("Failed:", errorText);
        alert("❌ Failed to submit results");
        return;
      }

      alert("✅ Results submitted successfully!");
    } catch (err) {
      console.error(err);
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
    } else {
      setTrialIndex(i => i + 1);
      setInitialAnswer(null);
      setInitialConfidence(null);
      setAiRevealed(false);
      setAiAnswer("");
      setTReveal(null);
      setTQuestionStart(Date.now());
    }
  }


  // INTRO SCREEN
  if (showIntro) {
    return (
      <div style={{ width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: 40, textAlign: "center" }}>
        <div style={{ maxWidth: 700 }}>
          <h1>Welcome to the Experiment</h1>
          <p style={{ marginTop: 20, fontSize: 18 }}>
            Welcome to the experiment! Thank you for participating.
            <br /><br />
            You will be presented with a series of claims. For each claim, decide whether it is true or false.
            You will also rate your confidence in your answer on a scale from 1 (not confident) to 7 (very confident). 
            Your confidence score has no impact on your score, so please be honest!
            Each claim you answer correctly earns you 100 points. The maximum possible is 2000 points.
            <br /><br />
            You will also have the option to consult an AI assistant for help with your answer. 
            You will not lose any points for consulting the AI.
            <br /><br />
            Your goal is simply to earn as many points as you can. Good luck!
          </p>
          <button onClick={() => setShowIntro(false)} style={{ marginTop: 30, padding: "12px 30px", fontSize: 18 }}>
            Start
          </button>
        </div>
      </div>
    );

  }


  // Main
  return (
    <div
      style={{
        padding: 40,
        width: "100vw",
        minHeight: "100vh",
        background: bg,
        color: text,
        fontFamily: "sans-serif",
      }}
    >
      {/* Score */}
      <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", fontSize: 28, fontWeight: "bold" }}>
        Score: {score}
      </div>

      {/* Theme Toggle */}
      <ThemedButton
        active={false}
        theme={theme}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        style={{ position: "absolute", top: 20, right: 20 }}
      >
        Toggle {theme === "dark" ? "Light" : "Dark"} Mode
      </ThemedButton>

      {/* Claim */}
      <h3>Claim:</h3>
      <p style={{ fontSize: 20 }}>{trial.claim}</p>

      <div style={{ display: "flex", gap: 30, marginTop: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 300 }}>
        
        {/* True/False */}
        <p><strong>Your Answer:</strong></p>
        <div>
          <ThemedButton
            active={initialAnswer === true}
            theme={theme}
            onClick={() => setInitialAnswer(true)}
          >
            True
          </ThemedButton>

          <ThemedButton
            active={initialAnswer === false}
            theme={theme}
            onClick={() => setInitialAnswer(false)}
          >
            False
          </ThemedButton>
        </div>

        <div style={{ display: "flex", flex: 1, flexDirection: "column"}}>
          {/* Confidence */}
          <div>
            <p style={{ marginTop: 20 }}><strong>Your Confidence (1–7):</strong></p>
            {[1,2,3,4,5,6,7].map(num => (
              <ThemedButton
                key={num}
                active={initialConfidence === num}
                theme={theme}
                onClick={() => setInitialConfidence(num)}
              >
                {num}
              </ThemedButton>
            ))}
          </div>

          {/* Submit */}
          <ThemedButton
            active={false}
            theme={theme}
            disabled={isSubmitting || initialAnswer === null || initialConfidence === null}
            onClick={submitTrial}
            style={{ marginTop: 25, maxWidth: 150 }}
          >
            {isSubmitting ? "Submitting..." : "Submit Answer"}
          </ThemedButton>
        </div>
      </div>


  {/* AI Help */}
  {trialIndex < 10 && (
    <div style={{ flex: 1, minWidth: 300, borderLeft: "1px solid #ccc", paddingLeft: 20 }}>
      {!aiRevealed ? (
        <>
          <p><strong>Optional AI Help:</strong></p>
          <ThemedButton
            active={false}
            theme={theme}
            onClick={revealAI}
            style={{ padding: "8px 12px" }}
          >
            Reveal AI's Answer
          </ThemedButton>
        </>
      ) : (
        <>
          <p><strong>AI Answer:</strong></p>
          <div style={{ 
            padding: 15, 
            border: "1px solid #ccc", 
            borderRadius: 8,
            background: theme === "dark" ? "#2a2535" : "#fff",
            minHeight: 60,
            wordWrap: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "pre-wrap",
            maxWidth: "100%"
          }}>
            {aiLoading ? "Loading AI response..." : aiAnswer}
          </div>
        </>
      )}
    </div>
  )}
</div>
    </div>
  );
}