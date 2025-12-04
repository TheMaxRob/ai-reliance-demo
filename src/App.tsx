import React, { useMemo, useState } from "react";

const CLAIMS = [
  {
    id: 1,
    claim: "Leaving a laptop plugged in constantly will significantly damage the battery.",
    correctAnswer: "false",
  },
  {
    id: 2,
    claim: "Your stomach replaces its lining every two to three days.",
    correctAnswer: "false",
  },
  {
    id: 3,
    claim: "Africa is larger than the United States, China, and India combined.",
    correctAnswer: "true",
  },
  {
    id: 4,
    claim: "The Amazon rainforest produces 20% of the world’s oxygen.",
    correctAnswer: "false",
  },
  {
    id: 5,
    claim: "The population of Iceland is more than 300,000 people.",
    correctAnswer: "true",
  },
  {
    id: 6,
    claim: "There are hundreds of harmful chemicals in tires.",
    correctAnswer: "true",
  },
  {
    id: 7,
    claim: "The Moon's gravity affects your weight on Earth when it is closer or farther away.",
    correctAnswer: "false",
  },
  {
    id: 8,
    claim: "A basketball will hit the ground before a tennis ball when dropped at the same height.",
    correctAnswer: "false",
  },
  {
    id: 9,
    claim: "A raincloud weighs more than an 18-wheeler truck.",
    correctAnswer: "true",
  },
  {
    id: 10,
    claim: "Human bodies contain equal numbers of bacterial and human cells.",
    correctAnswer: "false",
  },
  {
    id: 11,
    claim: "Most humans can distinguish about 10 million different colors.",
    correctAnswer: "false",
  },
  {
    id: 12,
    claim: "Almost all the dust in your home comes from dead human skin.",
    correctAnswer: "false",
  },
  {
    id: 13,
    claim: "Humans emit less carbon dioxide walking one mile than a car traveling the same distance.",
    correctAnswer: "true",
  },
  {
    id: 14,
    claim: "The average person speaks over 16,000 words per day.",
    correctAnswer: "false",
  },
  {
    id: 15,
    claim: "Most plastic in the ocean comes from rivers.",
    correctAnswer: "true",
  },
  {
    id: 16,
    claim: "The average adult spends more money on groceries than on subscriptions.",
    correctAnswer: "true",
  },
  {
    id: 17,
    claim: "The average person's skin regenerates roughly every 28 days.",
    correctAnswer: "false",
  },
  {
    id: 18,
    claim: "Around 20% of people who are left-handed are also left-footed.",
    correctAnswer: "false",
  },
  {
    id: 19,
    claim: "The Great Wall of China is visible from space with the naked eye.",
    correctAnswer: "false",
  },
  {
    id: 20,
    claim: "The average person spends about equal time in REM sleep as in deep sleep.",
    correctAnswer: "true",
  },
]

const rawUrl = import.meta.env.VITE_URL
if (!rawUrl) {
  throw new Error("Missing REACT_APP_URL in environment variables");
}
const url = rawUrl; // now it's guaranteed to be a string


interface TrialResult {
  trial: number;
  claim: string;
  initialAnswer: "true" | "false";
  initialConfidence: number;
  aiOffered: boolean;
  aiRevealed: boolean;
  isCorrect: boolean;
  timeBeforeAI: number | null;
  timeAfterAI: number | null;
  timeTotal: number | null;
  scoreIncrement: number;
}

function shuffleArray(arr: any[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function App() {
  const shuffledClaims = useMemo(() => shuffleArray(CLAIMS), []);

  const [results, setResults] = useState<TrialResult[]>([]);
  const participantID = useMemo(() => crypto.randomUUID(), []);
  const [showIntro, setShowIntro] = useState(true);
  const [trialIndex, setTrialIndex] = useState(0);

  const [initialAnswer, setInitialAnswer] = useState<"true" | "false" | null>(null);
  const [initialConfidence, setInitialConfidence] = useState<number | null>(null);

  const [aiRevealed, setAiRevealed] = useState(false);
  const [tAIShown, setTAIShown] = useState<number | null>(null);

  const [score, setScore] = useState(0);
  const [tQuestionStart, setTQuestionStart] = useState<number | null>(Date.now());
  const [tReveal, setTReveal] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trial = shuffledClaims[trialIndex];
  const aiAllowed = trialIndex < 10;

  function revealAI() {
    if (!aiRevealed) {
      const now = Date.now();
      setTAIShown(now);
      setTReveal(now);
    }
    setAiRevealed(true);
  }

  async function sendResultsToGoogleSheet() {
    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ participantID, results }),
      });
      alert("Experiment complete! Your results were submitted.");
    } catch (error) {
      console.error(error);
      alert("Experiment complete, but there was an error submitting your results.");
    }
  }

  async function submitTrial() {
    if (!initialAnswer || initialConfidence == null) {
      alert("Please give an answer AND confidence before submitting.");
      return;
    }

    const submissionTime = Date.now();

    const timeQuestionTotal = submissionTime - (tQuestionStart ?? submissionTime);
    const timeBeforeAI = tReveal ? tReveal - tQuestionStart! : null;
    const timeAfterAI = tReveal ? submissionTime - tReveal : null;

    const isCorrect = initialAnswer === trial.correctAnswer;
    if (isCorrect) setScore(prev => prev + 100);

    setResults(prev => [
      ...prev,
      {
        trial: trial.id,
        claim: trial.claim,
        initialAnswer,
        initialConfidence,
        aiOffered: aiAllowed,
        aiRevealed,
        isCorrect,
        timeBeforeAI,
        timeAfterAI,
        timeTotal: timeQuestionTotal,
        scoreIncrement: isCorrect ? 100 : 0,
      }
    ]);

    if (trialIndex + 1 < shuffledClaims.length) {
      setTrialIndex(prev => prev + 1);

      setInitialAnswer(null);
      setInitialConfidence(null);
      setAiRevealed(false);
      setTAIShown(null);
      setTQuestionStart(Date.now());
      setTReveal(null);
    } else {
      setIsSubmitting(true);
      await sendResultsToGoogleSheet();
      setIsSubmitting(false);
    }
  }

  if (showIntro) {
    return (
      <div style={{ width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: 40, textAlign: "center" }}>
        <div style={{ maxWidth: 700 }}>
          <h1>Welcome to the AI Reliance Experiment</h1>
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

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif", width: "100vw", minHeight: "100vh" }}>
      <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", fontSize: 28, fontWeight: "bold" }}>
        Score: {score}
      </div>

      <h3>Claim:</h3>
      <p style={{ fontSize: 20 }}>{trial.claim}</p>

      <div style={{ display: "flex", gap: 30, marginTop: 20 }}>

        {/* USER INPUT SECTION */}
        <div style={{ flex: 1, flexDirection: "column" }}>
          <p><strong>Your Answer:</strong></p>
          <div>
            <button onClick={() => setInitialAnswer("true")} style={{ marginRight: 10, background: initialAnswer === "true" ? "#747087" : "#46415c" }}>True</button>
            <button onClick={() => setInitialAnswer("false")} style={{ background: initialAnswer === "false" ? "#747087" : "#46415c" }}>False</button>
          </div>

          <div>
            <p style={{ marginTop: 20 }}><strong>Your Confidence (1–7):</strong></p>
            {[1,2,3,4,5,6,7].map(num => (
              <button key={num} onClick={() => setInitialConfidence(num)} style={{ marginRight: 5, padding: "6px 10px", background: initialConfidence === num ? "#747087" : "#46415c" }}>
                {num}
              </button>
            ))}
          </div>

          <button style={{ marginTop: 25, padding: "10px 20px" }} onClick={submitTrial}>
            {isSubmitting ? "Submitting..." : "Submit Answer"}
          </button>
        </div>

        {/* AI HELP SECTION */}
        {aiAllowed && (
          <div style={{ flex: 1, borderLeft: "1px solid #ccc", paddingLeft: 20 }}>
            {!aiRevealed ? (
              <>
                <p><strong>Optional AI Help:</strong></p>
                <button onClick={revealAI} style={{ padding: "8px 12px" }}>
                  Reveal AI’s Answer
                </button>
              </>
            ) : (
              <>
                <p><strong>AI Answer:</strong></p>
                <div style={{ padding: 15, border: "1px solid #ccc", borderRadius: 8, maxWidth: 400 }}>
                  {trial.aiAnswer || "No AI answer available."}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
