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
  category?: string;
}

export default function Home() {
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'study' | 'grid'>('study');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

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

  // Kunin ang lahat ng unique folders/subjects mula sa cards list
  const categories = [
    'All',
    ...Array.from(new Set(cards.map((card) => card.category || 'General'))),
  ];

  // I-filter ang cards batay sa napiling folder/subject
  const filteredCards =
    selectedCategory === 'All'
      ? cards
      : cards.filter((card) => (card.category || 'General') === selectedCategory);

  return (
    <main style={mainContainerStyle}>
      <h1>⚡ DLFlashcards</h1>

      <AddFlashcardForm onCardAdded={fetchCards} />

      <hr style={{ margin: '24px 0', borderColor: '#e2e8f0' }} />

      {/* 📁 Folder / Subject Selector Filter */}
      <div style={folderSectionStyle}>
        <span style={folderLabelStyle}>📁 Folders / Subjects:</span>
        <div style={folderContainerStyle}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                ...folderTabStyle,
                backgroundColor: selectedCategory === cat ? '#0f172a' : '#f1f5f9',
                color: selectedCategory === cat ? '#ffffff' : '#334155',
              }}
            >
              {cat === 'All' ? '🌐 All Cards' : `📂 ${cat}`} (
              {cat === 'All'
                ? cards.length
                : cards.filter((c) => (c.category || 'General') === cat).length}
              )
            </button>
          ))}
        </div>
      </div>

      {/* View Switcher Buttons */}
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
          📋 View All ({filteredCards.length})
        </button>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <p>Loading flashcards...</p>
      ) : filteredCards.length === 0 ? (
        <p>Wala pang flashcards sa folder na ito. Magdagdag gamit ang form sa taas!</p>
      ) : mode === 'study' ? (
        <StudyMode cards={filteredCards} onRefresh={fetchCards} />
      ) : (
        <div style={gridContainerStyle}>
          {filteredCards.map((card) => (
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
  padding: '20px 12px',
  maxWidth: '800px',
  margin: '0 auto',
  textAlign: 'center',
  fontFamily: 'sans-serif',
  boxSizing: 'border-box',
};

const folderSectionStyle: React.CSSProperties = {
  marginBottom: '20px',
};

const folderLabelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 'bold',
  color: '#64748b',
  display: 'block',
  marginBottom: '8px',
};

const folderContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '8px',
  flexWrap: 'wrap',
};

const folderTabStyle: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: '0.85rem',
  fontWeight: 600,
  border: '1px solid #cbd5e1',
  borderRadius: '20px',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '8px',
  marginBottom: '20px',
  flexWrap: 'wrap',
};

const tabButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '0.9rem',
  fontWeight: 600,
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  minHeight: '42px',
};

const gridContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  justifyContent: 'center',
  width: '100%',
};