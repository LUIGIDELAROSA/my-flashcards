// components/Flashcard.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface FlashcardProps {
  id: string;
  question: string;
  answer: string;
  imageUrl?: string | null;
  cardType?: 'identification' | 'multiple_choice';
  onRefresh?: () => void;
  isDarkMode?: boolean; // 👈 Idinagdag para sa Dark Mode support
}

export default function Flashcard({
  id,
  question,
  answer,
  imageUrl,
  cardType,
  onRefresh,
  isDarkMode = false,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // 1. Local state para ma-save at hindi mawala ang tinype mo agad sa screen
  const [currentQuestion, setCurrentQuestion] = useState(question);
  const [currentAnswer, setCurrentAnswer] = useState(answer);

  // 2. Kapag nagbago ang data galing database (ex. nag-refresh ang app), i-sync natin dito
  useEffect(() => {
    setCurrentQuestion(question);
    setCurrentAnswer(answer);
  }, [question, answer]);

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

  const handleEdit = async (field: 'question' | 'answer', newValue: string) => {
    if (!newValue.trim()) return;

    // 3. I-update agad ang nakikita sa screen
    if (field === 'question') {
      setCurrentQuestion(newValue);
    } else {
      setCurrentAnswer(newValue);
    }

    // 4. I-save sa Supabase Database
    const { error } = await supabase
      .from('flashcards')
      .update({ [field]: newValue })
      .eq('id', id);

    if (error) {
      console.error('Supabase Error:', error);
      alert('Error saving edit: ' + error.message);
    } else {
      // 5. Tawagin ang onRefresh para mag-update ang buong app
      if (onRefresh) onRefresh();
    }
  };

  // Dynamic Colors para sa Dark Mode at Light Mode
  const theme = {
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#0f172a',
    label: isDarkMode ? '#94a3b8' : '#64748b',
    hint: isDarkMode ? '#64748b' : '#94a3b8',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    badgeBg: isDarkMode ? '#3b1111' : '#fff0f0',
    badgeText: isDarkMode ? '#ff8080' : '#800000',
  };

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      style={{
        ...cardContainerStyle,
        backgroundColor: theme.cardBg,
        borderColor: theme.border,
      }}
    >
      <div style={cardHeaderStyle}>
        <span
          style={{
            ...typeBadgeStyle,
            backgroundColor: theme.badgeBg,
            color: theme.badgeText,
          }}
        >
          {cardType === 'multiple_choice' ? 'Multiple Choice' : 'Identification'}
        </span>
        <button onClick={handleDelete} style={deleteBtnStyle} title="Delete Card">
          🗑️
        </button>
      </div>

      <span style={{ ...labelStyle, color: theme.label }}>
        {isFlipped ? 'DEFINITION' : 'TERM'}
      </span>

      {!isFlipped && imageUrl && (
        <div style={imageContainerStyle}>
          <img src={imageUrl} alt="Card visual" style={imageStyle} />
        </div>
      )}

      {/* Direct Inline Editable Question / Answer */}
      <h3
        contentEditable
        suppressContentEditableWarning
        onClick={(e) => e.stopPropagation()} // Pigilan mag-flip habang nagta-type
        onBlur={(e) => {
          const newValue = e.currentTarget.textContent || '';
          handleEdit(isFlipped ? 'answer' : 'question', newValue);
        }}
        style={{
          ...editableContentStyle,
          color: theme.text,
        }}
        title="Click to edit text"
      >
        {isFlipped ? currentAnswer : currentQuestion}
      </h3>

      <span style={{ ...hintStyle, color: theme.hint }}>
        Click anywhere on card (except text) to flip
      </span>
    </div>
  );
}

// BASE STYLES
const cardContainerStyle: React.CSSProperties = {
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
  transition: 'all 0.2s ease',
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

const editableContentStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: 700,
  margin: '12px 0',
  padding: '8px',
  border: '1px dashed transparent',
  borderRadius: '8px',
  cursor: 'text',
  transition: 'all 0.2s ease',
  outline: 'none',
};

const hintStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  textAlign: 'center',
};