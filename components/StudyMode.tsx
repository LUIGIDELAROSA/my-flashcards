// components/StudyMode.tsx
'use client';

import { useState, useEffect } from 'react';
import Flashcard from './Flashcard';

interface FlashcardData {
  id: string;
  question: string;
  answer: string;
}

interface StudyModeProps {
  cards: FlashcardData[];
  onRefresh: () => void;
}

export default function StudyMode({ cards, onRefresh }: StudyModeProps) {
  const [cardList, setCardList] = useState<FlashcardData[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCardList(cards);
    // Siguraduhing hindi lalagpas ang index kung may naburang card
    if (currentIndex >= cards.length && cards.length > 0) {
      setCurrentIndex(cards.length - 1);
    }
  }, [cards, currentIndex]);

  if (cardList.length === 0) return null;

  const currentCard = cardList[currentIndex];

  const handleNext = () => {
    if (currentIndex < cardList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...cardList].sort(() => Math.random() - 0.5);
    setCardList(shuffled);
    setCurrentIndex(0);
  };

  return (
    <div style={containerStyle}>
      {/* Header: Counter & Shuffle */}
      <div style={headerStyle}>
        <span style={counterStyle}>
          Card <strong>{currentIndex + 1}</strong> of {cardList.length}
        </span>
        <button onClick={handleShuffle} style={shuffleBtnStyle}>
          🔀 Shuffle
        </button>
      </div>

      {/* Flashcard Component */}
      <Flashcard
        key={currentCard.id}
        id={currentCard.id}
        question={currentCard.question}
        answer={currentCard.answer}
        onRefresh={onRefresh}
      />

      {/* Controls: Prev & Next */}
      <div style={controlsStyle}>
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          style={{
            ...navBtnStyle,
            opacity: currentIndex === 0 ? 0.5 : 1,
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          ⬅️ Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === cardList.length - 1}
          style={{
            ...navBtnStyle,
            opacity: currentIndex === cardList.length - 1 ? 0.5 : 1,
            cursor: currentIndex === cardList.length - 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Next ➡️
        </button>
      </div>
    </div>
  );
}

// 📱 Responsiveness & Layout Fixes
const containerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '480px', // Maluwag para magkasya ang Flashcard nang maayos
  margin: '20px auto',
  padding: '20px',
  backgroundColor: '#f8fafc',
  borderRadius: '16px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  boxSizing: 'border-box', // Iwas-overflow sa mobile screens
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
};

const counterStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#64748b',
};

const shuffleBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: '0.85rem',
  backgroundColor: '#e2e8f0',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 600,
};

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '20px',
  gap: '12px',
};

const navBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  fontSize: '1rem',
  fontWeight: 600,
  backgroundColor: '#0f172a',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  transition: 'opacity 0.2s',
};