// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Flashcard from '@/components/Flashcard';
import AddFlashcardForm from '@/components/AddFlashcardForm';
import StudyMode from '@/components/StudyMode';

interface FlashcardData {
  id: string;
  question: string;
  answer: string;
}

export default function Home() {
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'study' | 'grid'>('study'); // Default to Study Mode

  const fetchCards = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cards:', error);
    } else {
      setCards(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCards();
  }, []);

  return (
    <main style={mainContainerStyle}>
      <h1>⚡ My Cloud Flashcards</h1>

      <AddFlashcardForm onCardAdded={fetchCards} />

      <hr style={{ margin: '24px 0', borderColor: '#e2e8f0' }} />

      {/* Mode Switcher Buttons */}
      <div style={tabContainerStyle}>
        <button
          onClick={() => setMode('study')}
          style={{
            ...tabButtonStyle,
            backgroundColor: mode === 'study' ? '#2563eb' : '#e2e8f0',
            color: mode === 'study' ? '#ffffff' : '#334155',
          }}
        >
          🎯 Study Mode
        </button>
        <button
          onClick={() => setMode('grid')}
          style={{
            ...tabButtonStyle,
            backgroundColor: mode === 'grid' ? '#2563eb' : '#e2e8f0',
            color: mode === 'grid' ? '#ffffff' : '#334155',
          }}
        >
          📋 View All ({cards.length})
        </button>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <p>Loading flashcards...</p>
      ) : cards.length === 0 ? (
        <p>Wala pang flashcards. Magdagdag gamit ang form sa taas!</p>
      ) : mode === 'study' ? (
        <StudyMode cards={cards} onRefresh={fetchCards} />
      ) : (
        <div style={gridContainerStyle}>
          {cards.map((card) => (
            <Flashcard
              key={card.id}
              id={card.id}
              question={card.question}
              answer={card.answer}
              onRefresh={fetchCards}
            />
          ))}
        </div>
      )}
    </main>
  );
}

// Mobile Responsive Inline Styles
const mainContainerStyle: React.CSSProperties = {
  padding: '20px 12px', // Maliit na padding lang sa mobile
  maxWidth: '800px',
  margin: '0 auto',
  textAlign: 'center',
  fontFamily: 'sans-serif',
  boxSizing: 'border-box',
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '8px',
  marginBottom: '20px',
  flexWrap: 'wrap', // Mag-ne-next line kung masyadong makitid ang screen
};

const tabButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '0.9rem',
  fontWeight: 600,
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  minHeight: '42px', // Touch friendly height
};

const gridContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  justifyContent: 'center',
  width: '100%',
};