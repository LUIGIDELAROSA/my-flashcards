// components/AddFlashcardForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AddFlashcardFormProps {
  onCardAdded: () => void;
}

export default function AddFlashcardForm({ onCardAdded }: AddFlashcardFormProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !answer) return;

    setLoading(true);
    const { error } = await supabase.from('flashcards').insert([
      {
        question,
        answer,
        category: category.trim() || 'General',
      },
    ]);

    setLoading(false);

    if (error) {
      alert('Error adding card: ' + error.message);
    } else {
      setQuestion('');
      setAnswer('');
      setCategory('General');
      onCardAdded();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3> Magdagdag ng Bagong Flashcard</h3>
      <input
        type="text"
        placeholder="Subject / Folder (e.g. Science, Math)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        style={inputStyle}
      />
      <input
        type="text"
        placeholder="Tanong (Question)"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        required
        style={inputStyle}
      />
      <input
        type="text"
        placeholder="Sagot (Answer)"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        required
        style={inputStyle}
      />
      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? 'Adding...' : 'Add Flashcard'}
      </button>
    </form>
  );
}

const formStyle: React.CSSProperties = {
  maxWidth: '400px',
  margin: '0 auto 20px auto',
  padding: '16px',
  backgroundColor: '#f1f5f9',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '14px',
};

const buttonStyle: React.CSSProperties = {
  padding: '10px',
  backgroundColor: '#2563eb',
  color: 'white',
  fontWeight: 'bold',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
};