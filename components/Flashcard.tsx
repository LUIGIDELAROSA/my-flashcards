// components/Flashcard.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface FlashcardProps {
  id: string;
  question: string;
  answer: string;
  imageUrl?: string;
  cardType?: 'identification' | 'multiple_choice';
  onRefresh?: () => void;
}

export default function Flashcard({
  id,
  question,
  answer,
  imageUrl,
  cardType,
  onRefresh,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmDelete = window.confirm('Are you sure you want to delete this flashcard?');
    if (!confirmDelete) return;

    const { error } = await supabase.from('flashcards').delete().eq('id', id);
    if (error) {
      alert('Error deleting card: ' + error.message);
    } else if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div onClick={() => setIsFlipped(!isFlipped)} style={cardContainerStyle}>
      <div style={cardHeaderStyle}>
        <span style={typeBadgeStyle}>
          {cardType === 'multiple_choice' ? 'Multiple Choice' : 'Identification'}
        </span>
        <button onClick={handleDelete} style={deleteBtnStyle} title="Delete Card">
          🗑️
        </button>
      </div>

      <span style={labelStyle}>{isFlipped ? 'DEFINITION' : 'TERM'}</span>

      {!isFlipped && imageUrl && (
        <div style={imageContainerStyle}>
          <img src={imageUrl} alt="Card visual" style={imageStyle} />
        </div>
      )}

      <h3 style={contentStyle}>{isFlipped ? answer : question}</h3>

      <span style={hintStyle}>Click to flip card</span>
    </div>
  );
}

const cardContainerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '20px',
  minHeight: '200px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  cursor: 'pointer',
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  position: 'relative',
  transition: 'transform 0.15s ease',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
};

const typeBadgeStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  color: '#800000',
  backgroundColor: '#fff0f0',
  padding: '2px 8px',
  borderRadius: '6px',
};

const deleteBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.9rem',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 800,
  color: '#64748b',
  marginTop: '8px',
};

const imageContainerStyle: React.CSSProperties = {
  margin: '8px 0',
  maxHeight: '120px',
  overflow: 'hidden',
  borderRadius: '6px',
};

const imageStyle: React.CSSProperties = {
  maxHeight: '120px',
  maxWidth: '100%',
  objectFit: 'contain',
};

const contentStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 700,
  color: '#0f172a',
  margin: '12px 0',
};

const hintStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#94a3b8',
  textAlign: 'center',
};