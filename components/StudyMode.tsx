// components/StudyMode.tsx
'use client';

import { useState, useEffect } from 'react';

export interface FlashcardData {
  id: string;
  question: string;
  answer: string;
  folder_id?: string;
  card_type?: 'identification' | 'multiple_choice';
  options?: string[];
  image_url?: string;
}

interface StudyModeProps {
  cards: FlashcardData[];
  onRefresh?: () => void;
}

export default function StudyMode({ cards }: StudyModeProps) {
  // Session Mode State: 'setup' | 'active'
  const [sessionState, setSessionState] = useState<'setup' | 'active'>('setup');
  const [chosenMode, setChosenMode] = useState<'identification' | 'multiple_choice'>('identification');

  // Quiz Navigation States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);

  // Scoring States
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const currentCard = cards[currentIndex];

  useEffect(() => {
    restartQuiz();
  }, [cards]);

  useEffect(() => {
    if (sessionState === 'active' && currentCard) {
      prepareOptionsForCurrentCard();
    }
  }, [currentIndex, sessionState, chosenMode]);

  // Generates Multiple Choice options if missing
  const prepareOptionsForCurrentCard = () => {
    if (!currentCard) return;

    if (currentCard.options && currentCard.options.length >= 2) {
      setCurrentOptions([...currentCard.options].sort(() => 0.5 - Math.random()));
    } else {
      const otherAnswers = cards
        .map((c) => c.answer.trim())
        .filter((ans) => ans.toLowerCase() !== currentCard.answer.trim().toLowerCase());
      
      const uniqueOthers = Array.from(new Set(otherAnswers));
      const shuffledOthers = uniqueOthers.sort(() => 0.5 - Math.random()).slice(0, 3);
      const combined = Array.from(new Set([currentCard.answer.trim(), ...shuffledOthers]));
      setCurrentOptions(combined.sort(() => 0.5 - Math.random()));
    }
  };

  const startSession = (mode: 'identification' | 'multiple_choice') => {
    setChosenMode(mode);
    setSessionState('active');
    setCurrentIndex(0);
    setScore(0);
    setIsFlipped(false);
    setUserInput('');
    setSelectedOption(null);
    setHasAnswered(false);
    setIsCorrect(null);
    setShowResult(false);
  };

  const handleCheckAnswer = (answerToSubmit?: string) => {
    if (hasAnswered) return;

    const answerToCheck = answerToSubmit ?? userInput;
    if (!answerToCheck.trim()) return;

    const formattedUserAns = answerToCheck.trim().toLowerCase();
    const formattedCorrectAns = currentCard.answer.trim().toLowerCase();

    const correct = formattedUserAns === formattedCorrectAns;
    setIsCorrect(correct);
    setHasAnswered(true);
    setIsFlipped(true);

    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextCard = () => {
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setUserInput('');
      setSelectedOption(null);
      setHasAnswered(false);
      setIsCorrect(null);
    } else {
      setShowResult(true);
    }
  };

  const restartQuiz = () => {
    setSessionState('setup');
    setCurrentIndex(0);
    setScore(0);
    setIsFlipped(false);
    setUserInput('');
    setSelectedOption(null);
    setHasAnswered(false);
    setIsCorrect(null);
    setShowResult(false);
  };

  if (!cards || cards.length === 0) {
    return <div style={containerStyle}>No flashcards available in this folder.</div>;
  }

  // 1️⃣ PRE-PRACTICE MODE SELECTION SCREEN
  if (sessionState === 'setup') {
    return (
      <div style={selectionBoxStyle}>
        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🎯</div>
        <h2 style={{ color: '#800000', margin: '0 0 8px 0', fontSize: '1.6rem' }}>
          Choose Practice Mode
        </h2>
        <p style={{ color: '#4b5563', margin: '0 0 24px 0', fontSize: '0.95rem' }}>
          Select how you want to answer questions for this practice session:
        </p>

        <div style={modeButtonGroupStyle}>
          <button
            onClick={() => startSession('identification')}
            style={modeOptionBtnStyle}
          >
            <span style={{ fontSize: '1.5rem' }}>✍️</span>
            <div>
              <strong style={{ display: 'block', fontSize: '1.05rem' }}>Identification Mode</strong>
              <small style={{ color: '#6b7280' }}>Type out your answer manually for each card</small>
            </div>
          </button>

          <button
            onClick={() => startSession('multiple_choice')}
            style={modeOptionBtnStyle}
          >
            <span style={{ fontSize: '1.5rem' }}>🔘</span>
            <div>
              <strong style={{ display: 'block', fontSize: '1.05rem' }}>Multiple Choice Mode</strong>
              <small style={{ color: '#6b7280' }}>Select the correct answer from options</small>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // 2️⃣ RESULT SUMMARY SCREEN
  if (showResult) {
    const percentage = Math.round((score / cards.length) * 100);
    const isPassed = percentage >= 75;

    return (
      <div style={resultCardStyle}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>
          {percentage === 100 ? '🎉🏆' : isPassed ? '👏' : '💪'}
        </div>
        <h2 style={{ color: '#800000', margin: '0 0 8px 0', fontSize: '1.8rem' }}>
          Session Completed!
        </h2>
        <p style={{ color: '#4b5563', margin: '0 0 20px 0' }}>Here is your final score:</p>

        <div style={scoreBoxStyle}>
          <span style={scoreTextStyle}>
            {score} / {cards.length}
          </span>
          <span style={percentageTextStyle}>({percentage}%)</span>
        </div>

        <p style={{ fontWeight: 600, color: isPassed ? '#16a34a' : '#dc2626', marginBottom: '24px' }}>
          {percentage === 100
            ? 'Perfect Score! Outstanding performance!'
            : isPassed
            ? 'Great job! You passed the session!'
            : 'Keep practicing to improve your score!'}
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => startSession(chosenMode)} style={restartBtnStyle}>
            🔄 Retry Mode
          </button>
          <button onClick={restartQuiz} style={changeModeBtnStyle}>
            ⚙️ Change Mode
          </button>
        </div>
      </div>
    );
  }

  // 3️⃣ ACTIVE PRACTICE SCREEN
  return (
    <div style={containerStyle}>
      {/* Header & Progress */}
      <div style={progressHeaderStyle}>
        <span style={progressTextStyle}>
          Card {currentIndex + 1} of {cards.length}
        </span>
        <button onClick={restartQuiz} style={modeBadgeStyle} title="Click to change practice mode">
          Mode: <b>{chosenMode === 'multiple_choice' ? 'Multiple Choice 🔘' : 'Identification ✍️'}</b>
        </button>
        <span style={liveScoreBadgeStyle}>
          Score: <b>{score}</b>
        </span>
      </div>

      {/* Flashcard Container */}
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
          {isFlipped ? 'DEFINITION (ANSWER)' : 'QUESTION'}
        </span>

        {!isFlipped && currentCard.image_url && (
          <div style={imageWrapperStyle}>
            <img
              src={currentCard.image_url}
              alt="Question visual"
              style={imageStyle}
            />
          </div>
        )}

        <h2 style={cardContentStyle}>
          {isFlipped ? currentCard.answer : currentCard.question}
        </h2>

        <span style={flipHintStyle}>
          💡 Click card to flip ({isFlipped ? 'Show Question' : 'Show Answer'})
        </span>
      </div>

      {/* Answer Area based on chosen session mode */}
      {!hasAnswered ? (
        <div style={inputAreaStyle}>
          {chosenMode === 'multiple_choice' ? (
            <div style={optionsGridStyle}>
              {currentOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedOption(option);
                    handleCheckAnswer(option);
                  }}
                  style={{
                    ...optionBtnStyle,
                    backgroundColor: selectedOption === option ? '#800000' : '#ffffff',
                    color: selectedOption === option ? '#ffffff' : '#1f2937',
                  }}
                >
                  <span style={optionIndexStyle}>{String.fromCharCode(65 + idx)}.</span> {option}
                </button>
              ))}
            </div>
          ) : (
            <div style={inputGroupStyle}>
              <input
                type="text"
                placeholder="Type your answer here..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckAnswer()}
                style={inputStyle}
              />
              <button onClick={() => handleCheckAnswer()} style={checkBtnStyle}>
                Submit
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Feedback & Next Button */
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
              <span>🎉 <b>Correct!</b> Well done!</span>
            ) : (
              <span>
                ❌ <b>Incorrect.</b> The correct answer is: <b>{currentCard.answer}</b>
              </span>
            )}
          </div>

          <button onClick={handleNextCard} style={nextBtnStyle}>
            {currentIndex + 1 === cards.length ? 'View Final Score 🏆' : 'Next Card ➡️'}
          </button>
        </div>
      )}
    </div>
  );
}

// Styles
const containerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const selectionBoxStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  padding: '36px 24px',
  textAlign: 'center',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  border: '2px solid #800000',
  maxWidth: '520px',
  margin: '0 auto',
};

const modeButtonGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const modeOptionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '16px 20px',
  borderRadius: '12px',
  border: '2px solid #e5e7eb',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.2s ease',
};

const progressHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 4px',
  flexWrap: 'wrap',
  gap: '8px',
};

const progressTextStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 700,
  color: '#6b7280',
};

const modeBadgeStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#800000',
  backgroundColor: '#fff0f0',
  padding: '4px 10px',
  borderRadius: '12px',
  border: '1px solid #800000',
  cursor: 'pointer',
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
  padding: '30px 24px',
  minHeight: '240px',
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

const imageWrapperStyle: React.CSSProperties = {
  margin: '12px 0',
  maxHeight: '180px',
  overflow: 'hidden',
  borderRadius: '8px',
};

const imageStyle: React.CSSProperties = {
  maxHeight: '180px',
  maxWidth: '100%',
  objectFit: 'contain',
};

const cardContentStyle: React.CSSProperties = {
  fontSize: '1.4rem',
  fontWeight: 700,
  color: '#111827',
  margin: '12px 0',
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

const optionsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '10px',
};

const optionBtnStyle: React.CSSProperties = {
  padding: '14px 18px',
  borderRadius: '10px',
  border: '1.5px solid #800000',
  fontSize: '0.95rem',
  fontWeight: 600,
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
};

const optionIndexStyle: React.CSSProperties = {
  fontWeight: 800,
  marginRight: '6px',
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
  padding: '12px 20px',
  backgroundColor: '#800000',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 800,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const changeModeBtnStyle: React.CSSProperties = {
  padding: '12px 20px',
  backgroundColor: '#f3f4f6',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
};