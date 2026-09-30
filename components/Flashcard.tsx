'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './Flashcard.module.css';

interface FlashcardProps {
  id: string;
  question: string;
  answer: string;
  onRefresh?: () => void;
}

export default function Flashcard({ id, question, answer, onRefresh }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // States para sa Type-your-Answer Feature
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  // Edit Form States
  const [editQuestion, setEditQuestion] = useState(question);
  const [editAnswer, setEditAnswer] = useState(answer);
  const [loading, setLoading] = useState(false);

  // 🎯 Function para suriin kung tama ang sagot (Case-Insensitive)
  const handleCheckAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Khit UPPERCASE/lowercase o may extra space, gagawing malinis:
    const cleanUserAnswer = userAnswer.trim().toLowerCase();
    const cleanCorrectAnswer = answer.trim().toLowerCase();

    if (cleanUserAnswer === cleanCorrectAnswer) {
      setFeedback('correct');
      setIsFlipped(true); // Awtomatikong ipapakita ang likod kapag tama!
    } else {
      setFeedback('incorrect');
    }
  };

  // Function para mag-delete ng card
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Sigurado ka bang gusto mong burahin ang flashcard na ito?')) return;

    setLoading(true);
    const { error } = await supabase.from('flashcards').delete().eq('id', id);
    setLoading(false);

    if (error) {
      alert('Error deleting card: ' + error.message);
    } else if (onRefresh) {
      onRefresh();
    }
  };

  // Function para mag-save ng update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    const { error } = await supabase
      .from('flashcards')
      .update({ question: editQuestion, answer: editAnswer })
      .eq('id', id);

    setLoading(false);

    if (error) {
      alert('Error updating card: ' + error.message);
    } else {
      setIsEditing(false);
      if (onRefresh) onRefresh();
    }
  };

  // Edit Mode View
  if (isEditing) {
    return (
      <div className={styles.cardContainer}>
        <form onSubmit={handleUpdate} style={editFormStyle} onClick={(e) => e.stopPropagation()}>
          <h4>✏️ Edit Flashcard</h4>
          <input
            type="text"
            value={editQuestion}
            onChange={(e) => setEditQuestion(e.target.value)}
            required
            placeholder="Tanong"
            style={inputStyle}
          />
          <input
            type="text"
            value={editAnswer}
            onChange={(e) => setEditAnswer(e.target.value)}
            required
            placeholder="Sagot"
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button type="submit" disabled={loading} style={saveBtnStyle}>
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} style={cancelBtnStyle}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.cardContainer} onClick={() => setIsFlipped(!isFlipped)}>
      <div className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}>
        
        {/* HARAP NA BAHAGI (Tanong + Answer Box) */}
        <div className={`${styles.cardSide} ${styles.cardFront}`}>
          <div style={actionsContainerStyle}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              style={iconBtnStyle}
              title="Edit Card"
            >
              ✏️
            </button>
            <button onClick={handleDelete} style={iconBtnStyle} title="Delete Card">
              🗑️
            </button>
          </div>

          <span className={styles.label}>Tanong</span>
          <p className={styles.text}>{question}</p>

          {/* ✍️ Form para sa pag-type ng sagot */}
          <form onSubmit={handleCheckAnswer} onClick={(e) => e.stopPropagation()} style={answerFormStyle}>
            <input
              type="text"
              placeholder="I-type ang sagot mo..."
              value={userAnswer}
              onChange={(e) => {
                setUserAnswer(e.target.value);
                setFeedback(null); // I-reset ang feedback kapag nagti-type uli
              }}
              style={{
                ...inputStyle,
                borderColor:
                  feedback === 'correct' ? '#16a34a' : feedback === 'incorrect' ? '#dc2626' : '#cbd5e1',
              }}
            />
            <button type="submit" style={checkBtnStyle}>
              Suriin
            </button>
          </form>

          {/* Feedback Indicator */}
          {feedback === 'correct' && (
            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '0.85rem' }}>
              🎉 Tama ang sagot mo!
            </span>
          )}
          {feedback === 'incorrect' && (
            <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '0.85rem' }}>
              ❌ Mali, subukan ulit o i-click ang card para makita ang sagot.
            </span>
          )}

          <span className={styles.hint}>I-click ang card para i-flip 🔄</span>
        </div>

        {/* LIKOD NA BAHAGI (Sagot) */}
        <div className={`${styles.cardSide} ${styles.cardBack}`}>
          <span className={styles.label}>Sagot</span>
          <p className={styles.text}>{answer}</p>
        </div>

      </div>
    </div>
  );
}

// Additional Inline Styles
const actionsContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  display: 'flex',
  gap: '6px',
  zIndex: 10,
};

const iconBtnStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.05)',
  border: 'none',
  borderRadius: '50%',
  width: '28px',
  height: '28px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const answerFormStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  width: '100%',
  maxWidth: '100%',
  marginTop: '8px',
  marginBottom: '4px',
  boxSizing: 'border-box',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0, // 👈 SOLUSYON SA OVERFLOW: Pinapayagan ang input na mag-shrink para magkasya ang button!
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const checkBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap', // Para hindi maputol ang salitang "Suriin"
  flexShrink: 0,       // Sinisiguradong buo ang button
};

const editFormStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '20px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  justifyContent: 'center',
};

const saveBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  backgroundColor: '#16a34a',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 600,
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  backgroundColor: '#64748b',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
};