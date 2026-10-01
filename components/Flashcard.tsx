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

  // Function para i-save ang in-edit na text sa database
  const handleEdit = async (field: 'question' | 'answer', newValue: string) => {
    if (!newValue.trim()) return;
    const { error } = await supabase
      .from('flashcards')
      .update({ [field]: newValue })
      .eq('id', id);
      
    if (error) {
      alert('Error updating flashcard: ' + error.message);
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

      {/* Editable na Text (Question o Answer depende kung naka-flip) */}
      <h3
        contentEditable
        suppressContentEditableWarning
        onClick={(e) => e.stopPropagation()} // Pigilan mag-flip kapag nag-click para mag-type
        onBlur={(e) => handleEdit(isFlipped ? 'answer' : 'question', e.currentTarget.textContent || '')}
        style={editableContentStyle}
        title="Click to edit text"
      >
        {isFlipped ? answer : question}
      </h3>

      <span style={hintStyle}>Click anywhere on card (except text) to flip</span>
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

const editableContentStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: 700,
  color: '#0f172a',
  margin: '12px 0',
  padding: '8px',
  border: '1px dashed transparent',
  borderRadius: '8px',
  cursor: 'text', // Ipinapakita na pwede i-type
  transition: 'all 0.2s ease',
};

// Dinagdag sa CSS globally via style object kapag naka-focus (madadagdagan ng border)
// Dahil inline styles gamit natin, maa-achieve ito manually pero ginawang transparent dashed border muna sa itaas.
const hintStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#94a3b8',
  textAlign: 'center',
};