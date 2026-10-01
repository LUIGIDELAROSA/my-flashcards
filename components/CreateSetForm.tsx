// components/CreateSetForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CardInput {
  id: string;
  question: string;
  answer: string;
}

interface CreateSetFormProps {
  onSetCreated: () => void;
  onCancel?: () => void;
}

export default function CreateSetForm({ onSetCreated, onCancel }: CreateSetFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState<CardInput[]>([
    { id: '1', question: '', answer: '' },
    { id: '2', question: '', answer: '' },
  ]);
  const [loading, setLoading] = useState(false);

  // Magdagdag ng panibagong card row
  const addCardRow = () => {
    setCards((prev) => [
      ...prev,
      { id: Date.now().toString(), question: '', answer: '' },
    ]);
  };

  // Magbura ng partikular na card row
  const removeCardRow = (index: number) => {
    if (cards.length <= 1) {
      alert('Kailangan ng kahit isang flashcard sa set!');
      return;
    }
    setCards((prev) => prev.filter((_, i) => i !== index));
  };

  // I-update ang input value ng card
  const handleCardChange = (index: number, field: 'question' | 'answer', value: string) => {
    setCards((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  // I-save ang buong Set (Folder + All Cards) sa Supabase
  const handleSave = async () => {
    if (!title.trim()) {
      alert('Mangyaring maglagay ng Title / Subject name!');
      return;
    }

    const validCards = cards.filter((c) => c.question.trim() && c.answer.trim());
    if (validCards.length === 0) {
      alert('Maglagay ng kahit isang kumpletong flashcard (Tanong at Sagot)!');
      return;
    }

    setLoading(true);

    // 1. Gumawa ng bagong Folder / Subject
    const { data: folderData, error: folderError } = await supabase
      .from('folders')
      .insert([{ name: title.trim() }])
      .select()
      .single();

    if (folderError) {
      alert('Error creating set: ' + folderError.message);
      setLoading(false);
      return;
    }

    // 2. I-batch insert ang lahat ng valid flashcards sa ginawang folder
    const cardsToInsert = validCards.map((c) => ({
      question: c.question.trim(),
      answer: c.answer.trim(),
      folder_id: folderData.id,
    }));

    const { error: cardsError } = await supabase
      .from('flashcards')
      .insert(cardsToInsert);

    setLoading(false);

    if (cardsError) {
      alert('Error saving flashcards: ' + cardsError.message);
    } else {
      setTitle('');
      setDescription('');
      setCards([
        { id: '1', question: '', answer: '' },
        { id: '2', question: '', answer: '' },
      ]);
      onSetCreated();
    }
  };

  return (
    <div style={pageContainerStyle}>
      {/* 🏷️ TOP HEADER */}
      <div style={headerStyle}>
        <div>
          <h2 style={titleHeadingStyle}>Gumawa ng bagong flashcard set</h2>
          <span style={subHeadingStyle}>Pumili ng pamagat at magdagdag ng mga card</span>
        </div>
        <div style={headerBtnGroupStyle}>
          {onCancel && (
            <button onClick={onCancel} style={cancelBtnStyle}>
              Kanselahin
            </button>
          )}
          <button onClick={handleSave} disabled={loading} style={maroonPrimaryBtnStyle}>
            {loading ? 'Sina-save...' : 'Gumawa & I-save'}
          </button>
        </div>
      </div>

      {/* 📝 FOLDER / SUBJECT DETAILS */}
      <div style={inputSectionStyle}>
        <input
          type="text"
          placeholder="Title (e.g. Differential Equations, BOSH)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={titleInputStyle}
        />
        <input
          type="text"
          placeholder="Add a description... (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={descriptionInputStyle}
        />
      </div>

      {/* 🃏 FLASHCARD ROWS LIST */}
      <div style={cardsListContainerStyle}>
        {cards.map((card, index) => (
          <div key={card.id} style={cardRowStyle}>
            {/* Card Row Header */}
            <div style={cardRowHeaderStyle}>
              <span style={cardIndexStyle}>{index + 1}</span>
              <button
                onClick={() => removeCardRow(index)}
                style={deleteRowBtnStyle}
                title="Burahin itong card"
              >
                🗑️
              </button>
            </div>

            {/* Inputs: Term & Definition */}
            <div style={inputsGridStyle}>
              <div style={inputGroupStyle}>
                <input
                  type="text"
                  placeholder="Enter term / tanong"
                  value={card.question}
                  onChange={(e) => handleCardChange(index, 'question', e.target.value)}
                  style={cardInputStyle}
                />
                <span style={inputLabelStyle}>TERM (TANONG)</span>
              </div>

              <div style={inputGroupStyle}>
                <input
                  type="text"
                  placeholder="Enter definition / sagot"
                  value={card.answer}
                  onChange={(e) => handleCardChange(index, 'answer', e.target.value)}
                  style={cardInputStyle}
                />
                <span style={inputLabelStyle}>DEFINITION (SAGOT)</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ➕ ADD CARD BUTTON (CENTERED) */}
      <div style={addCardContainerStyle}>
        <button onClick={addCardRow} style={addCardBtnStyle}>
          ➕ Magdagdag ng Card
        </button>
      </div>

      {/* 💾 BOTTOM ACTION BAR */}
      <div style={bottomActionBarStyle}>
        <button onClick={handleSave} disabled={loading} style={maroonPrimaryBtnStyle}>
          {loading ? 'Sina-save...' : 'Gumawa & I-save'}
        </button>
      </div>
    </div>
  );
}

// 🎨 WHITE & MAROON (#800000) STYLES
const pageContainerStyle: React.CSSProperties = {
  maxWidth: '900px',
  margin: '0 auto',
  padding: '24px 16px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  backgroundColor: '#fcfcfc',
  color: '#1a1a1a',
  borderRadius: '16px',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
  flexWrap: 'wrap',
  gap: '12px',
};

const titleHeadingStyle: React.CSSProperties = {
  fontSize: '1.6rem',
  fontWeight: 800,
  color: '#800000', // Maroon
  margin: 0,
};

const subHeadingStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#666666',
};

const headerBtnGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
};

const maroonPrimaryBtnStyle: React.CSSProperties = {
  backgroundColor: '#800000', // Maroon
  color: '#ffffff',
  padding: '10px 20px',
  borderRadius: '8px',
  border: 'none',
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(128, 0, 0, 0.25)',
  transition: 'background-color 0.2s',
};

const cancelBtnStyle: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  color: '#374151',
  padding: '10px 18px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const inputSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginBottom: '28px',
};

const titleInputStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: '10px',
  border: '2px solid #e5e7eb',
  fontSize: '1.1rem',
  fontWeight: 600,
  backgroundColor: '#ffffff',
  outline: 'none',
  color: '#111827',
};

const descriptionInputStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  fontSize: '0.95rem',
  backgroundColor: '#ffffff',
  outline: 'none',
  color: '#4b5563',
};

const cardsListContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  marginBottom: '24px',
};

const cardRowStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '16px 20px',
  border: '1px solid #e5e7eb',
  borderTop: '4px solid #800000', // Maroon accent border
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
};

const cardRowHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
  borderBottom: '1px solid #f3f4f6',
  paddingBottom: '8px',
};

const cardIndexStyle: React.CSSProperties = {
  fontWeight: 800,
  color: '#800000',
  fontSize: '1rem',
};

const deleteRowBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  opacity: 0.7,
};

const inputsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '16px',
};

const inputGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const cardInputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '0.95rem',
  backgroundColor: '#fafafa',
  outline: 'none',
};

const inputLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  color: '#6b7280',
  letterSpacing: '0.05em',
};

const addCardContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  margin: '24px 0',
};

const addCardBtnStyle: React.CSSProperties = {
  padding: '12px 28px',
  backgroundColor: '#fff0f0', // Very light maroon tint
  color: '#800000',
  border: '2px dashed #800000',
  borderRadius: '10px',
  fontWeight: 700,
  fontSize: '0.95rem',
  cursor: 'pointer',
  width: '100%',
  maxWidth: '300px',
};

const bottomActionBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '20px',
  paddingTop: '16px',
  borderTop: '1px solid #e5e7eb',
};