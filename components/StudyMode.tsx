// components/StudyMode.tsx
'use client';

import { useState, useEffect } from 'react';

interface FlashcardData {
  id: string;
  question: string;
  answer: string;
  folder_id?: string;
}

interface StudyModeProps {
  cards: FlashcardData[];
  onRefresh?: () => void;
}

export default function StudyMode({ cards }: StudyModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // 📊 SCORING STATE
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // I-reset kapag nagpalit ng folder / set ng cards
  useEffect(() => {
    restartQuiz();
  }, [cards]);

  const currentCard = cards[currentIndex];

  // 1. I-check ang pinalo na sagot ng user
  const handleCheckAnswer = () => {
    if (!userInput.trim() || hasAnswered) return;

    const formattedUserAns = userInput.trim().toLowerCase();
    const formattedCorrectAns = currentCard.answer.trim().toLowerCase();

    const correct = formattedUserAns === formattedCorrectAns;
    setIsCorrect(correct);
    setHasAnswered(true);
    setIsFlipped(true); // I-flip para makita ang tamang sagot

    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  // 2. Manual Self-Rating ("✅ Tama" o "❌ Mali" button)
  const handleManualMark = (correct: boolean) => {
    if (hasAnswered) return;

    setIsCorrect(correct);
    setHasAnswered(true);
    setIsFlipped(true);

    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  // 3. Lumipat sa Susunod na Card
  const handleNextCard = () => {
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setUserInput('');
      setHasAnswered(false);
      setIsCorrect(null);
    } else {
      setShowResult(true); // Tapos na ang lahat ng cards!
    }
  };

  // 4. I-restart ang Quiz
  const restartQuiz = () => {
    setCurrentIndex(0);
    setScore(0);
    setIsFlipped(false);
    setUserInput('');
    setHasAnswered(false);
    setIsCorrect(null);
    setShowResult(false);
  };

  if (!cards || cards.length === 0) {
    return <div style={containerStyle}>Walang flashcards sa set na ito.</div>;
  }

  // 🏆 RESULT / SCORE SUMMARY SCREEN
  if (showResult) {
    const percentage = Math.round((score / cards.length) * 100);
    const isPassed = percentage >= 75;

    return (
      <div style={resultCardStyle}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>
          {percentage === 100 ? '🎉🏆' : isPassed ? '👏' : '💪'}
        </div>
        <h2 style={{ color: '#800000', margin: '0 0 8px 0', fontSize: '1.8rem' }}>
          Tapos na ang Study Session!
        </h2>
        <p style={{ color: '#4b5563', margin: '0 0 20px 0' }}>
          Ito ang nakuha mong marka:
        </p>

        {/* SCORE BOX */}
        <div style={scoreBoxStyle}>
          <span style={scoreTextStyle}>
            {score} / {cards.length}
          </span>
          <span style={percentageTextStyle}>({percentage}%)</span>
        </div>

        <p style={{ fontWeight: 600, color: isPassed ? '#16a34a' : '#dc2626', marginBottom: '24px' }}>
          {percentage === 100
            ? 'Perfect Score! Napakahusay!'
            : isPassed
            ? 'Magaling! Naisaulo mo ang karamihan!'
            : 'Subukan ulit para mas tumatak sa isip!'}
        </p>

        <button onClick={restartQuiz} style={restartBtnStyle}>
          🔄 Ulitin ang Session
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* 📊 SCORE HEADER & PROGRESS */}
      <div style={progressHeaderStyle}>
        <span style={progressTextStyle}>
          Card {currentIndex + 1} sa {cards.length}
        </span>
        <span style={liveScoreBadgeStyle}>
          Score: <b>{score}</b>
        </span>
      </div>

      {/* 🃏 FLIP CARD DISPLAY */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          ...cardContainerStyle,
          borderColor: hasAnswered
            ? isCorrect
              ? '#22c55e'
              : '#ef4444'
            : '#e5e7eb',
        }}
      >
        <span style={cardLabelStyle}>
          {isFlipped ? 'DEFINITION (SAGOT)' : 'TERM (TANONG)'}
        </span>

        <h2 style={cardContentStyle}>
          {isFlipped ? currentCard.answer : currentCard.question}
        </h2>

        <span style={flipHintStyle}>
          💡 I-click ang card para i-flip ({isFlipped ? 'Tanong' : 'Sagot'})
        </span>
      </div>

      {/* 📝 INPUT & CHECK SECTION */}
      {!hasAnswered ? (
        <div style={inputAreaStyle}>
          <div style={inputGroupStyle}>
            <input
              type="text"
              placeholder="I-type ang sagot mo..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckAnswer()}
              style={inputStyle}
            />
            <button onClick={handleCheckAnswer} style={checkBtnStyle}>
              Suriin
            </button>
          </div>

          <div style={manualRateGroupStyle}>
            <span style={orLabelStyle}>o kaya piliin:</span>
            <button
              onClick={() => handleManualMark(true)}
              style={correctBtnStyle}
            >
              ✅ Tama (+1)
            </button>
            <button
              onClick={() => handleManualMark(false)}
              style={wrongBtnStyle}
            >
              ❌ Mali (+0)
            </button>
          </div>
        </div>
      ) : (
        /* 💡 RESULT / NEXT BUTTON */
        <div style={feedbackAreaStyle}>
          <div
            style={{
              ...feedbackBoxStyle,
              backgroundColor: isCorrect ? '#f0fdf4' : '#fef2f2',
              color: isCorrect ? '#166534' : '#991b1b',
              border: `1px solid ${isCorrect ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            {isCorrect ? (
              <span>🎉 <b>Tama!</b> Magaling!</span>
            ) : (
              <span>
                ❌ <b>Mali.</b> Ang tamang sagot ay: <b>{currentCard.answer}</b>
              </span>
            )}
          </div>

          <button onClick={handleNextCard} style={nextBtnStyle}>
            {currentIndex + 1 === cards.length ? 'Tingnan ang Score 🏆' : 'Sunod na Card ➡️'}
          </button>
        </div>
      )}
    </div>
  );
}

// 🎨 STYLES (WHITE & MAROON)
const containerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const progressHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 4px',
};

const progressTextStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 700,
  color: '#6b7280',
};

const liveScoreBadgeStyle: React.CSSProperties = {
  backgroundColor: '#fff0f0',
  color: '#800000',
  padding: '4px 12px',
  borderRadius: '20px',
  fontSize: '0.85rem',
  border: '1px solid #800000',
};

const cardContainerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '40px 24px',
  minHeight: '220px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',
  textAlign: 'center',
  cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
  borderWidth: '2px',
  borderStyle: 'solid',
  transition: 'all 0.2s ease',
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 800,
  color: '#800000',
  letterSpacing: '0.08em',
};

const cardContentStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#111827',
  margin: '16px 0',
};

const flipHintStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#9ca3af',
};

const inputAreaStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const inputGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  borderRadius: '10px',
  border: '1px solid #d1d5db',
  fontSize: '0.95rem',
  outline: 'none',
};

const checkBtnStyle: React.CSSProperties = {
  padding: '12px 20px',
  backgroundColor: '#800000',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 700,
  cursor: 'pointer',
};

const manualRateGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  justifyContent: 'center',
};

const orLabelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#6b7280',
};

const correctBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#dcfce7',
  color: '#15803d',
  border: '1px solid #86efac',
  borderRadius: '8px',
  fontWeight: 700,
  cursor: 'pointer',
};

const wrongBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#fee2e2',
  color: '#b91c1c',
  border: '1px solid #fca5a5',
  borderRadius: '8px',
  fontWeight: 700,
  cursor: 'pointer',
};

const feedbackAreaStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const feedbackBoxStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: '10px',
  textAlign: 'center',
  fontSize: '0.95rem',
};

const nextBtnStyle: React.CSSProperties = {
  padding: '14px',
  backgroundColor: '#800000',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 800,
  fontSize: '1rem',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(128, 0, 0, 0.2)',
};

const resultCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  padding: '40px 24px',
  textAlign: 'center',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  border: '2px solid #800000',
  maxWidth: '500px',
  margin: '0 auto',
};

const scoreBoxStyle: React.CSSProperties = {
  backgroundColor: '#fff0f0',
  border: '2px dashed #800000',
  borderRadius: '16px',
  padding: '20px',
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  margin: '0 auto 20px auto',
  minWidth: '180px',
};

const scoreTextStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 900,
  color: '#800000',
};

const percentageTextStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 700,
  color: '#4b5563',
};

const restartBtnStyle: React.CSSProperties = {
  padding: '12px 28px',
  backgroundColor: '#800000',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 800,
  fontSize: '1rem',
  cursor: 'pointer',
};