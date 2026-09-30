// components/AddFlashcardForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  onCardAdded: () => void; // Kakailanganin para ma-refresh ang listahan
}

export default function AddFlashcardForm({ onCardAdded }: Props) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !answer) return;

    setLoading(true);

    // I-insert sa Supabase table na 'flashcards'
    const { error } = await supabase
      .from('flashcards')
      .insert([{ question, answer }]);

    setLoading(false);

    if (error) {
      alert('Error adding card: ' + error.message);
    } else {
      setQuestion('');
      setAnswer('');
      onCardAdded(); // Tawagin ito para ma-reload ang listahan ng cards
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3>Magdagdag ng Bagong Flashcard</h3>
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

// Simple Inline Styles
const formStyle = {
  maxWidth: '400px',
  margin: '20px auto',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '10px',
  padding: '20px',
  border: '1px solid #ccc',
  borderRadius: '8px',
};

const inputStyle = {
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid #ccc',
};

const buttonStyle = {
  padding: '10px',
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};