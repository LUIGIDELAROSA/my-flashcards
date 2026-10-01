// components/AddFlashcardForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Folder {
  id: string;
  name: string;
}

interface AddFlashcardFormProps {
  folders: Folder[];
  selectedFolderId: string;
  onRefresh: () => void;
}

export default function AddFlashcardForm({ folders, selectedFolderId, onRefresh }: AddFlashcardFormProps) {
  // Folder Creation State
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Flashcard State
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [targetFolderId, setTargetFolderId] = useState(selectedFolderId || '');
  const [loadingCard, setLoadingCard] = useState(false);

  // 📁 Function para gumawa ng Bagong Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setCreatingFolder(true);
    const { error } = await supabase.from('folders').insert([{ name: newFolderName.trim() }]);
    setCreatingFolder(false);

    if (error) {
      alert('Error creating folder: ' + error.message);
    } else {
      setNewFolderName('');
      onRefresh();
    }
  };

  // 🃏 Function para magdagdag ng Flashcard sa Napiling Folder
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const folderId = targetFolderId || selectedFolderId || (folders[0]?.id);

    if (!folderId) {
      alert('Pumili muna o gumawa ng folder bago magdagdag ng flashcard!');
      return;
    }

    if (!question.trim() || !answer.trim()) return;

    setLoadingCard(true);
    const { error } = await supabase.from('flashcards').insert([
      {
        question: question.trim(),
        answer: answer.trim(),
        folder_id: folderId,
      },
    ]);
    setLoadingCard(false);

    if (error) {
      alert('Error adding card: ' + error.message);
    } else {
      setQuestion('');
      setAnswer('');
      onRefresh();
    }
  };

  return (
    <div style={containerStyle}>
      {/* 📁 FORM 1: Gumawa muna ng Folder / Subject */}
      <form onSubmit={handleCreateFolder} style={boxStyle}>
        <h4 style={{ margin: '0 0 10px 0' }}>📁 1. Gumawa ng Bagong Folder / Subject</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Pangalan ng Subject (e.g. Differential Equations, BOSH)"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button type="submit" disabled={creatingFolder} style={primaryBtnStyle}>
            {creatingFolder ? '...' : '➕ Create Folder'}
          </button>
        </div>
      </form>

      {/* 🃏 FORM 2: Magdagdag ng Flashcard sa Folder */}
      <form onSubmit={handleAddCard} style={{ ...boxStyle, backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>⚡ 2. Magdagdag ng Flashcard sa Folder</h4>
        
        <label style={{ fontSize: '0.8rem', textAlign: 'left', fontWeight: 'bold', color: '#0369a1' }}>
          Ilalagay sa Folder:
        </label>
        <select
          value={targetFolderId || selectedFolderId}
          onChange={(e) => setTargetFolderId(e.target.value)}
          style={inputStyle}
          required
        >
          {folders.length === 0 ? (
            <option value="">(Gumawa muna ng folder sa taas)</option>
          ) : (
            folders.map((f) => (
              <option key={f.id} value={f.id}>
                📂 {f.name}
              </option>
            ))
          )}
        </select>

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
        <button type="submit" disabled={loadingCard || folders.length === 0} style={secondaryBtnStyle}>
          {loadingCard ? 'Adding...' : 'Add Flashcard'}
        </button>
      </form>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  maxWidth: '480px',
  margin: '0 auto 24px auto',
};

const boxStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '14px',
  outline: 'none',
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '10px 14px',
  backgroundColor: '#0f172a',
  color: 'white',
  fontWeight: 'bold',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '10px 14px',
  backgroundColor: '#2563eb',
  color: 'white',
  fontWeight: 'bold',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};