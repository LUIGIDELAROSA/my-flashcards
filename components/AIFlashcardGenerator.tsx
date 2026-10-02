// components/AIFlashcardGenerator.tsx
'use client';

import { useState } from 'react';

interface AIFlashcardGeneratorProps {
  onCardsGenerated: (newCards: { question: string; answer: string }[]) => void;
  onClose: () => void;
}

export default function AIFlashcardGenerator({ onCardsGenerated, onClose }: AIFlashcardGeneratorProps) {
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async () => {
    if (!textInput.trim() && !selectedFile) {
      setErrorMsg('Mag-paste ng text o mag-upload ng PDF file.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      if (textInput) formData.append('text', textInput);
      if (selectedFile) formData.append('file', selectedFile);

      const res = await fetch('/api/generate-flashcards', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.cards) {
        onCardsGenerated(data.cards);
        onClose();
      } else {
        setErrorMsg(data.error || 'Nagkaroon ng problema sa pagbuo ng flashcards.');
      }
    } catch (err) {
      setErrorMsg('Hindi makakonekta sa server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h2 style={{ color: '#800000', marginTop: 0 }}>✨ AI Flashcard Generator</h2>
        <p style={{ color: '#4b5563', fontSize: '0.9rem' }}>
          Mag-paste ng lecture notes o mag-upload ng PDF para awtomatikong gawan ng mga flashcards.
        </p>

        {/* Text Area */}
        <textarea
          placeholder="I-paste dito ang iyong lecture notes o paragraph..."
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          rows={6}
          style={textAreaStyle}
        />

        {/* File Upload */}
        <div style={{ margin: '12px 0' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
            O mag-upload ng PDF / Text File:
          </label>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            style={{ fontSize: '0.85rem' }}
          />
        </div>

        {errorMsg && <p style={{ color: '#dc2626', fontSize: '0.85rem' }}>{errorMsg}</p>}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={onClose} disabled={isLoading} style={cancelBtnStyle}>
            Cancel
          </button>
          <button onClick={handleGenerate} disabled={isLoading} style={generateBtnStyle}>
            {isLoading ? '⏳ Gumagawa...' : '🚀 Generate Flashcards'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Styles
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '16px',
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '24px',
  width: '100%',
  maxWidth: '500px',
  boxSizing: 'border-box',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
};

const textAreaStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: '10px',
  border: '1.5px solid #d1d5db',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
  outline: 'none',
  resize: 'vertical',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  backgroundColor: '#f3f4f6',
  cursor: 'pointer',
  fontWeight: 600,
};

const generateBtnStyle: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#800000',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: 700,
};